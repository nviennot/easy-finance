import Head from 'next/head'
import { CssBaseline, LinearProgress } from '@material-ui/core';

export default function Layout(props) {
  const { loading, children, ...otherProps } = props;

  return (
    <>
      <Head>
        <title>Easy finance</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      </Head>

      <CssBaseline />

      {loading ?
       <LinearProgress
         color="secondary"
         style={{position: "fixed", top: 0, left: 0, width: "100%"}}
       /> : null}

      <div {...otherProps}>
        {children}
      </div>
    </>
  )
}
