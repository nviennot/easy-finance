/*
 * Transforms the displayed transactions to something better
 */

export function transformTransactions(transactions) {
  /* Note: It's okay to modify objects. */
  transactions.forEach(trans => {
    let m;

    /* Consider pending transactions in account balances */
    if (trans.pending)
      trans.account.balance += trans.amount;

    const effectiveAmount = trans.account.type === 'credit' ? -trans.amount : trans.amount;

    /* Refunds */
    if (effectiveAmount > 0) {
      trans.displayClass = 'refund';
    }

    /* Trim Ally Bank transfers names */
    if (m = trans.name.match(/^(.*) transfer (to|from) .* account X+(\d+)$/)) {
      const [_, type, direction, account] = m;
      if (type === "Requested") {
        // automatic transfers
        trans.name = `Automatic transfer ${direction} ...${account}`;
        trans.displayClass = 'hide';
      } else {
        trans.name = `Transfer ${direction} ...${account}`;
      }
    }

    if (trans.name === 'Interest Paid') {
      trans.displayClass = 'hide';
    }

    /* Credit card payments */
    /* Checking account: amount is negative, and coming out
     * Credit cards: amount is also negative, and is a credit
     */
    if (trans.amount < 0 && (
      trans.name.match(/Thank/i) ||
      trans.name.match(/AMEX EPAYMENT ACH PMT/) ||
      trans.name.match(/Payment Received/) ||
      trans.name.match(/DISCOVER E-PAYMENT/) ||
      trans.name.match(/BK OF AMER VISA ONLINE PMT/) ||
      trans.name.match(/DIRECTPAY FULL BALANCE/) ||
      trans.name.match(/BA ELECTRONIC PAYMENT/) ||
      trans.name.match(/CHASE CREDIT CRD (AUTO|E)PAY/) ||
      trans.name.match(/BARCLAYCARD US CREDITCARD/))) {
        trans.displayClass = 'hide';
    }

    /* Fees should be seen very clearly */
    if (trans.name.match(/fee/i) && effectiveAmount < 0 &&
        trans.name !== "ATM Fee Reimbursement") {
      trans.displayClass = 'warning';
    }
  });

  return transactions;
}
