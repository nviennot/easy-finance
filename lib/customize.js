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

    /* Card payments */
    if (trans.amount < 0 && (
      trans.name.match(/AUTOMATIC PAYMENT/) ||
      trans.name.match(/AMEX EPAYMENT ACH PMT/) ||
      trans.name.match(/CHASE CREDIT CRD (AUTO|E)PAY/) ||
      trans.name.match(/AUTOPAY PAYMENT - THANK YOU/) ||
      trans.name.match(/BARCLAYCARD US CREDITCARD/) ||
      trans.name.match(/Payment Thank You/))) {
        trans.displayClass = 'hide';
    }

    /* Credit card refunds are marked as un important */
    if (trans.account.type === 'credit' && trans.amount <= 0) {
      trans.displayClass = 'refund';
    }

    /* Fees should be seen very clearly */
    if (trans.name.match(/fee/i) && trans.name !== "ATM Fee Reimbursement") {
      trans.displayClass = 'warning';
    }
  });

  return transactions;
}
