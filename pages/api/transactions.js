import { zip } from  '../../lib/util.js'
import * as DB from '../../lib/db'
import * as Bank from '../../lib/bank'
import { pick, ensureAuth } from '../../lib/util'
import moment from 'moment'

export default async (req, res) => {
  if (!ensureAuth(req, res))
    return;

  const requestDays = req.query.days && Number(req.query.days);
  const options = { numPastDays: requestDays || 14 };

  const banks = await DB.getBanks();
  let {accounts, transactions, balance} =
    await Bank.getCompiledTransactions(banks, options);

  transactions = transactions.map(t => {
    const date = moment(t.date).format('ddd DD MMM');
    return {date, ...pick(t, ['accountId', 'amount', 'name', 'pending', 'importance'])};
  });

  accounts = accounts.map(a => {
    const name = a.name || a.officialName;
    return {name, ...pick(a, ['id', 'balance', 'type', 'payFrom'])};
  });

  res.status(200).json({ transactions, accounts, options });
};
