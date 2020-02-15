import Layout from '../components/Layout';
import ErrorPage from '../components/ErrorPage';
import useRequest from '../components/useRequest';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { formatMoney, leftJoin, groupBy } from  '../lib/util';
import { Container, Button, Hidden } from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';

export default function IndexPage(props) {
  const router = useRouter();
  const req = { url: '/api/transactions', params: router.query };
  const { data, error, loading, refetch } = useRequest(req);

  if (error)
    return <ErrorPage>{error}</ErrorPage>

  if (data?.accounts?.length === 0) {
    router.push('/accounts');
    return null;
  }

  return (
    <Layout loading={loading} className="transactions-page">
      { data ? <TransactionsPage {...data} /> : null }
    </Layout>
  );
}

function TransactionsPage(props) {
  let { transactions, accounts, options } = props;
  const { numPastDays } = options;

  transactions = leftJoin(transactions, accounts,
    {key: 'account', foreignKey: 'accountId'});

  return (
    <Container maxWidth="md">
      <BalanceSummary accounts={accounts} />

      <h2>Transactions</h2>
      <table className="transactions">
        <tbody>
          { transactions.map((transaction, i) =>
            <TransactionRow key={i} {...transaction} />) }
        </tbody>
      </table>

      <p className="unimportant">
        The past {numPastDays} days are shown.
        &nbsp;
        <Link href={{query:{days: 2*numPastDays}}} scroll={false}>
          <a>Show more</a>
        </Link>
      </p>

      <h2>Current balances</h2>
      <table className="accounts">
        <tbody>
          { accounts.map((account, i) =>
            <AccountRow key={i} {...account} />) }
        </tbody>
      </table>

      <div style={{display: 'flex', justifyContent: 'flex-end',
                   marginTop: '2em', marginBottom: '2em'}}>
        <Link href='/accounts'>
          <Button variant="outlined" startIcon={<SettingsIcon />}>
            Configure
          </Button>
        </Link>
      </div>
    </Container>
  );
}

function BalanceSummary(props) {
  const { accounts } = props;

  const balances = (() => {
    /*
     * We associate credit cards with the depository account (checking account)
     * that they are associated with (paidFrom).
     */
    const accountingGroups = groupBy(accounts,
      a => a.type === 'depository' ? a.id : a.payFrom);

    let balances = Object.entries(accountingGroups).map(([id, grp]) => {
      const amount = grp.reduce((sum, a) =>
        sum + (a.type === 'credit' ? -a.balance : a.balance), 0);

      return {id, amount};
    });

    balances = leftJoin(balances, accounts,
      {key: 'payFrom', foreignKey: 'id'});

    return balances;
  })();

  const showNames = balances.length > 1;

  return (
    <div className="balances">
      {balances.map(balance =>
        <Balance
          key={balance.id}
          amount={balance.amount}
          name={showNames ? balance.payFrom.name : null}
        />)}
    </div>
  );
}

function Balance(props) {
  const { name, amount } = props;

  return (
    <div className="balance">
      <span className={`amount ${amount < 0 ? 'warning' : ''}`}>
        {formatMoney(amount)}
      </span>
      <span className="name">
        {name}
      </span>
    </div>
  );
}

function TransactionRow(props) {
  const { date, account, name, pending, amount, importance } = props;

  const rowClass = (() => {
    let classes = []

    if (importance)
      classes.push(`${importance}-importance`);

    if (pending)
      classes.push('pending');

    return classes.join(' ');
  })();

  return (
    <tr className={rowClass}>
      <td className="date">{date}</td>
      <Hidden xsDown>
        <td className="account">{account.name}</td>
      </Hidden>
      <td className="name">
          <div>
            <span>{name}</span>
            {pending
             ? <span className="pending">Ⓟ</span>
             : null}
          </div>
      </td>
      <td className="amount">{formatMoney(amount)}</td>
    </tr>
  );
}

function AccountRow(props) {
  const { name, balance } = props;

  return (
    <tr>
      <td className="name">{name}</td>
      <td className="amount">{formatMoney(balance)}</td>
    </tr>
  );
}
