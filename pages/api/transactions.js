import { zip } from  '../../lib/util.js'
import * as DB from '../../lib/db'
import * as Bank from '../../lib/bank'
import { pick, ensureAuth, getCache, putCache } from '../../lib/util'
import moment from 'moment'

export default async (req, res) => {
  if (!ensureAuth(req, res))
    return;

  const requestDays = req.query.days && Number(req.query.days);
  const options = { numPastDays: requestDays || 14 };

  /* For screenshots
  return res.status(200).json(require("../../transactions.json"));
  */

  const banks = await DB.getBanks();

  /* Useful to have a cronjob on this endpoint to refresh the cache periodically */
  const getData = async () => {
    const cacheKey = {banks, options};
    let data = getCache(cacheKey);
    if (data)
      return data;

    data = await Bank.getCompiledTransactions(banks, options);
    putCache(cacheKey, data, 10*60*1000); /* 10min expiration */

    return data;
  }

  let {accounts, transactions, balance} = await getData();

  transactions = transactions.map(t => {
    const date = moment(t.date).format('ddd DD MMM');
    return {date, ...pick(t, ['accountId', 'amount', 'name', 'pending', 'displayClass'])};
  });

  accounts = accounts.map(a => {
    const name = a.name || a.officialName;
    return {name, ...pick(a, ['id', 'balance', 'type', 'payFrom'])};
  });

  res.status(200).json({ transactions, accounts, options });
};
