import plaid from 'plaid';

if (!process.env.PLAID_CLIENT_ID)
  throw "PLAID env keys are not set. Run 'source with_env.sh' first";

const client = new plaid.Client(
  process.env.PLAID_CLIENT_ID,
  process.env.PLAID_SECRET,
  process.env.PLAID_PUBLIC_KEY,
  {
    'sandbox': plaid.environments.sandbox,
    'development': plaid.environments.development,
    'production': plaid.environments.production,
  }[process.env.PLAID_ENV],
  {
    version: '2019-05-29',
    timeout: 10 * 1000, // 10 seconds
  }
);

export default client;
