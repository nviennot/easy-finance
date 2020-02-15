import { Container } from '@material-ui/core';
import Layout from './Layout';

export default function ErrorPage(props) {
  return (
    <Layout>
      <Container maxWidth="sm">
        <div className="outer">
          <div className="inner">
            <h2>Error</h2>
            {props.children}
          </div>
        </div>

      <style jsx>{`
        .outer {
          margin-top: 5em;
          border: 1px solid #ccc;
          border-radius: 5px;
        }

        .inner {
          margin: 2em;
        }
      `}</style>
      </Container>
    </Layout>
  );
}
