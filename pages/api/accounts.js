import { zip } from  '../../lib/util.js'
import * as DB from '../../lib/db'
import * as Bank from '../../lib/bank'
import { pick, ensureAuth } from '../../lib/util'

const allowedTypes = ['credit', 'depository'];

async function get(req, res) {
  let banks = await DB.getBanks();

  const getBankProps = async bank => {
    try {
      let accounts = await Bank.getAccounts(bank);
      accounts = accounts.filter(a => allowedTypes.includes(a.type));
      return { accounts };
    } catch (error) {
      console.log(error);

      if (error.name !== "PlaidError")
        return { accounts: [], fetchError: { message: `${error}` } }

      let publicToken = null;
      if (error.error_code === "ITEM_LOGIN_REQUIRED")
        publicToken = await Bank.getPublicToken(bank);

      const fetchError = {
        code: error.error_code,
        message: error.error_message,
        publicToken
      };

      return { accounts: [], fetchError };
    }
  }

  let bankProps = banks.map(getBankProps);
  let bankNames = banks.map(Bank.getName);
  bankProps = await Promise.all(bankProps);
  bankNames = await Promise.all(bankNames);

  banks = zip(banks, bankProps, bankNames)
    .map(([bank, props, name]) => ({id: bank.id, ...props, name}));

  const plaidVars = {
    env: process.env.PLAID_ENV,
    key: process.env.PLAID_PUBLIC_KEY,
    clientName: 'Easy finance',
    product: ['transactions'],
  };

  res.status(200).json({ banks, plaidVars });
}


/*
 * There should be a better wayt to express our schema.
 * Maybe with GraphQL.
 */
function applyAccountSchema(account) {
  return pick(account,
    ['id', 'enabled', 'name', 'officialName', 'type', 'payFrom']);
}

function applyBankSchema(bank) {
  bank = pick(bank, ['id', 'name', 'accounts', 'deleted']);
  if (bank.accounts)
    bank.accounts = bank.accounts.map(applyAccountSchema);
  return bank;
}

async function put(req, res) {
  let banks = req.body.banks;

  if (!(banks instanceof Array))
    return res.status(500).json({ });

  banks = banks.map(applyBankSchema);
  await DB.putBanks(banks);

  const deleteBanks = (banksToDelete) => {
    /* TODO XXX banks with "deleted": true should be removed.
     * Note that in dev mode, the number of account does not
     * decrement
     */
    /*
    leftJoin(banksToDelete, DB.getBanks(), ...)
    for each: DB.forgetBank()
    */
  }
  //deleteBanks(banks.filter(bank => bank.deleted));

  res.status(200).json({ });
}


async function post(req, res) {
  const { publicToken, index } = req.body;
  const bank = await Bank.getBankFromPublicToken(publicToken);

  /* special hint for our firebase object to be at a specific order */
  bank._index = index;

  await DB.putBanks([bank]);
  res.status(200).json({ });
}


export default async (req, res) => {
  if (!ensureAuth(req, res))
    return;

  const m = {'GET': get, 'PUT': put, 'POST': post}
  await m[req.method](req, res);
};
