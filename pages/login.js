import Layout from '../components/Layout';
import NoSSR from '../components/NoSSR';
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

import {
  Container, Button, Grid, Paper,
  FormControl, InputAdornment, TextField,
} from '@material-ui/core';

import VpnKeyIcon from '@material-ui/icons/VpnKey';

export default function LoginPage(props) {
  const [password,   setPassword]   = useState("");
  const [error,      setError]      = useState();
  const [validating, setValidating] = useState();

  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    setValidating(true);
    axios.post('/api/login', { password })
      .then(response => router.push('/'))
      .catch(err => {
        setValidating(false);
        setError(err?.response?.data?.error || err.message);
      });
  };

  const handlePasswordChange = password => {
    setPassword(password);
    setError(null);
    setValidating(false);
  }

  return (
    <LoginLayout>
      <form onSubmit={handleLogin}
        style={{display: 'flex', padding: "2em 2em 1em 2em"}}>
        <FormControl style={{flex: "1", marginRight: "2em"}}>
          <TextField
            error={!!error}
            helperText={error ? error : " "}
            value={password}
            type="password"
            onChange={e => handlePasswordChange(e.target.value)}
            placeholder="Password"
            InputProps={{startAdornment:
              <InputAdornment position="start">
                <VpnKeyIcon color={error ? "error" : "primary"}/>
              </InputAdornment>}}
          />
        </FormControl>

        <FormControl>
          <Button
            type="submit"
            disabled={!!validating}
            style={{width:"8em"}}
            variant="contained"
            color="primary"
          >
            Login
          </Button>
        </FormControl>
      </form>
    </LoginLayout>
  );
}

function LoginLayout(props) {
  return (
    <Layout className="login-page">
      <NoSSR>
        <Container maxWidth="sm">
          <Grid container alignItems="center" style={{height: "100vh"}}>
            <Grid item xs={12}>
              <Paper xs={12}>
                {props.children}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </NoSSR>
    </Layout>
  );
}
