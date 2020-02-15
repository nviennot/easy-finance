import repl from 'repl'

import plaid from './plaid'
import * as firebase from './firebase'
import * as DB from './db'
import * as Bank from './bank'
import * as _util from './util'

require("util").inspect.defaultOptions.depth = null;

const r = repl.start();

r.context.firebase = firebase;
r.context.plaid = plaid;
r.context.DB = DB;
r.context.Bank = Bank;
r.context._util = _util;

// try this
async function try_this() {
  const {data} = require('./backup');
  banks = await DB.getBanks();
  results = await Bank.getCompiledTransactions(banks, {numPastDays: 5});
}
