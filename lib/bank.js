import moment from 'moment'
import DB from './db'
import plaid from './plaid'
import { zip, leftJoin } from  './util'
import { transformTransactions } from './customize'

export function normalizePlaidAccount(account) {
  return {
    id:           account['account_id'],
    officialName: `${account['official_name'] || account['name']} (${account['mask']})`,
    balance:      account['balances']['current'],
    type:         account['type'],
  };
}

export function normalizePlaidTransaction(trans) {
  return {
    id:        trans['transaction_id'],
    accountId: trans['account_id'],
    amount:    trans['amount'],
    date:      new Date(trans['date']),
    name:      trans['name'],
    pending:   trans['pending'],
    type:      trans['transaction_type'],
  };
}

export async function getBankFromPublicToken(publicToken) {
  const result = await plaid.exchangePublicToken(publicToken);
  const accessToken = result['access_token'];
  const id = result['item_id'];
  return {id, accessToken};
}

export async function getInstitutionName(bank) {
  const item = await plaid.getItem(bank.accessToken);
  const inst = await plaid.getInstitutionById(item['item']['institution_id']);
  return inst['institution']['name'];
}

export async function getName(bank) {
  return bank.name || await getInstitutionName(bank);
}

function mergeAccountWithSettings(accounts, banks) {
  const defaultAccountSettings = {enabled: false};

  const accountSettings = banks.map(b => b.accounts).flat(1);

  accounts = leftJoin(accounts, accountSettings, {key: 'settings', foreignKey: 'id'});
  accounts = accounts.map(account => {
    let {settings, ...a} = account;
    return {...defaultAccountSettings, ...a, ...settings};
  });

  return accounts;
}

export async function getAccounts(bank) {
  const results = await plaid.getAccounts(bank.accessToken);
  const accounts = results['accounts'].map(normalizePlaidAccount);
  return mergeAccountWithSettings(accounts, [bank]);
}

export async function getPublicToken(bank) {
  const results = await plaid.createPublicToken(bank.accessToken);
  return results['public_token'];
}

export async function forgetBank(bank) {
  const results = await plaid.removeItem(bank.accessToken);
  if (!results['removed'])
    throw "Can't remove account";
}

export async function getTransactions(banks, { numPastDays }) {
  if (banks.length === 0)
    return [[], []];

  const now = moment();
  const endDay = now.format('YYYY-MM-DD');
  const startDay = now.subtract(numPastDays, 'days').format('YYYY-MM-DD');

  const getSingleBankTransactions = async bank => {
    const accountIds = bank.accounts
      .filter(a => a.enabled)
      .map(a => a.id)

    if (accountIds.length === 0)
      return [[],[]]

    const result = await plaid.getAllTransactions(
      bank.accessToken, startDay, endDay, {account_ids: accountIds});

    return [
      result['accounts'].map(normalizePlaidAccount),
      result['transactions'].map(normalizePlaidTransaction),
    ];
  }

  const results = await Promise.all(banks.map(getSingleBankTransactions));

  /* The following concats the accounts lists and transactions lists */
  let [accounts, transactions] = zip(...results).map(a => [].concat(...a));

  accounts = mergeAccountWithSettings(accounts, banks);
  return [accounts, transactions];
}

export async function compileTransactions([accounts, transactions]) {
  transactions = leftJoin(transactions, accounts,
    {key: 'account', foreignKey: 'accountId'});

  /* Sort all transactions by date, descending */
  transactions = transactions.sort((a,b) => b.date-a.date);

  transactions.forEach(trans => {
    /* Checking/savings account amounts are reversed */
    if (trans.account.type === "depository")
      trans.amount = -trans.amount;
  });

  transactions = transformTransactions(transactions);

  /* Compute final balance. Credit cards balance count negatively */
  const balance = accounts.map(a => a.type === 'credit' ? -a.balance : a.balance)
                          .reduce((a,b) => a+b, 0);

  return { accounts, transactions, balance }
}

export async function getCompiledTransactions(banks, options) {
  const results = await getTransactions(banks, options);
  return compileTransactions(results);
}
