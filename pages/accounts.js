import Layout from '../components/Layout';
import ErrorPage from '../components/ErrorPage';
import useRequest from '../components/useRequest';
import useScript from '../components/useScript';
import NoSSR from '../components/NoSSR';
import { useState } from 'react';
import axios from 'axios';
import produce from 'immer';
import { useRouter } from 'next/router';
import Link from 'next/link';

import {
  Container, Button, Checkbox, Input, Grid,
  FormControl, InputLabel, InputAdornment,
  NativeSelect, Snackbar, IconButton,
} from '@material-ui/core';

import Alert from '@material-ui/lab/Alert';

import CreditCardIcon from '@material-ui/icons/CreditCard';
import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import SaveIcon from '@material-ui/icons/Save';
import AddIcon from '@material-ui/icons/Add';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SyncIcon from '@material-ui/icons/Sync';
import DeleteIcon from '@material-ui/icons/Delete';

export default function AccountsPage(props) {
  const { data, error, loading, refetch } = useRequest('/api/accounts');

  /*
   * We have to load plaid here. Performance would be hurt if we were to
   * useScript() in The MainForm component as it rerenders often.
   */
  let { loaded: plaidLoaded, error: plaidError } = useScript(
        'https://cdn.plaid.com/link/v2/stable/link-initialize.js');
  plaidError = plaidError && "Cannot load Plaid extension";

  if (error || plaidError)
    return <ErrorPage>{error || plaidError}</ErrorPage>

  const getInner = () => {
    if (!data)
      return null;

    let { banks, plaidVars } = data;

    if (!plaidLoaded)
      plaidVars = null;

    /*
     * Setting a key will ensure that we reload the whole form
     * if banks changes.
     */
    return (
      <Container maxWidth="sm">
        <NoSSR>
          <MainForm {...{refetch, plaidVars, initialBanks: banks}} />
        </NoSSR>
      </Container>
    );
  }

  return (
    <Layout loading={loading} className="accounts-page">
      {getInner()}
    </Layout>
  );
}

function MainForm(props) {
  const { refetch, plaidVars, initialBanks } = props;
  const [ banks, setBanks ] = useState(initialBanks);
  const [ saveStatus, setSaveStatus ] = useState({});
  const router = useRouter();

  /*
   * Deep compare.
   * Maybe not accurate, but that's okay, we'll show the save button as enabled
   * when we should not.
   */
  const pristine = JSON.stringify(initialBanks) === JSON.stringify(banks);

  /*
   * Credit cards can be payed from checking/savings accounts
   * denoted by the type depository
   */
  const payFroms = banks
    .filter(bank => !bank.deleted)
    .flatMap(bank => bank.accounts)
    .filter(a => a.enabled && a.type === 'depository');

  const openPlaidLink = options => {
    window.Plaid.create({...plaidVars, ...options}).open();
  }

  const handleAddBank = () => {
    const handlePlaidSuccess = publicToken => {
      const data = { publicToken, index: banks.length };
      /*
       * The following saves the current state, and reloads the data.
       * Could be better (if the user starts typing between now and
       * until the response comes back, her input would be discarded)
       * It's fine for now.
       */
      handleSave({ publicToken, banks });
    }
    openPlaidLink({ onSuccess: handlePlaidSuccess });
  }

  const handleBankPlaidUpdate = publicToken => {
    openPlaidLink({ token: publicToken, onSuccess: refetch });
  }

  const handleBankChange = (i, changes) => {
    setBanks(produce(banks, banksDraft => {
      Object.assign(banksDraft[i], changes);
    }));
  };

  const handleSave = (data, opts={}) => {
    const { thenGoBack } = opts;
    setSaveStatus({inProgress: true})
    /* XXX Error message is most likely not informative */
    axios.put('/api/accounts', data)
      .then(response => {
        if (thenGoBack) {
          router.push('/');
        } else {
          setBanks(response.data.banks);
          setSaveStatus({});
        }
      })
      .catch(error => setSaveStatus({error: `Error saving accounts: ${error}`}))
  };

  const handleSnackbarClose = () => setSaveStatus({});

  return (
    <div>
      <h1>Accounts</h1>

      { banks.length === 0
        ? <p>Customize accounts by pressing on the button below</p>
        : null
      }

      {banks.map((bank, i) =>
        <BankFields key={i} bank={bank} payFroms={payFroms}
          onBankPlaidUpdate={handleBankPlaidUpdate}
          onBankChange={(changes) => handleBankChange(i, changes)} />
      )}

      <div style={{display: 'flex', justifyContent: 'space-between',
                   flexWrap: 'wrap', marginTop: '3em', marginBottom: '2em'}}>
        <div style={{marginBottom: '1em'}}>
          <Button
            style={{minWidth: "12em"}}
            onClick={() => handleAddBank()}
            color="primary"
            variant="contained"
            disabled={!plaidVars}
            startIcon={<AddIcon />}
          >
            Add account
          </Button>
        </div>

        { banks.length > 0 ?
          <div style={{marginBottom: '1em'}}>
            <Link href='/'>
              <Button
                style={{marginRight: "1em", minWidth: "9em"}}
                variant="outlined" startIcon={<ArrowBackIcon />}>
                Go back
              </Button>
            </Link>

            <Button
              style={{minWidth: "9em"}}
              onClick={() => handleSave({ banks }, {thenGoBack: true})}
              variant="contained"
              disabled={pristine || saveStatus.inProgress}
              color="primary"
              startIcon={<SaveIcon />}
            >
              Save
            </Button>
          </div> : null }
      </div>

      <Snackbar
        open={!!saveStatus.error}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}>

        <Alert severity="error" elevation={6} variant="filled"
          onClose={handleSnackbarClose}>
          {saveStatus.error}
        </Alert>
      </Snackbar>
    </div>
  );
}

function BankFields(props) {
  const { bank, payFroms, onBankChange, onBankPlaidUpdate } = props;
  const { name, accounts, fetchError, deleted } = bank;

  const handleAccountChange = (j, changes) => {
    onBankChange(produce(bank, bankDraft => {
      Object.assign(bankDraft.accounts[j], changes);
    }));
  };

  const handleDeleteChange = (deleted) => {
    onBankChange(produce(bank, bankDraft => {
      Object.assign(bankDraft.deleted = deleted);
    }));
  };

  const getErrorMsg = () => {
    if (!fetchError)
      return null;

    const { code, message, publicToken } = fetchError;

    if (code === "ITEM_LOGIN_REQUIRED" && publicToken)
      return (<>
        <div>The login details of this item have changed (credentials, MFA, or
          required user action).</div>
        <div>Please press on the Update Credentials button to refresh this account.</div>
      </>);

    return message;
  }

  if (deleted) {
    return (
      <div>
        <div style={{marginTop: '2em', marginBottom: '-0.5em',
                     display: 'flex', justifyContent: 'space-between'}}>
          <h3>{name}</h3>
        </div>

        <p style={{fontStyle: "italic"}}>
          Account pending deletion
          <button onClick={() => handleDeleteChange(false)}
            style={{
              backgroundColor: 'transparent',
              fontSize: '0.9em',
              textDecoration: 'underline',
              border: 'none',
              cursor: 'pointer'}}>
            Undo
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{marginTop: '2em', marginBottom: '-0.5em',
                   display: 'flex', justifyContent: 'space-between'}}>
        <h3>{name}</h3>
        <FormControl style={{marginTop: '0.2em', marginRight: '-1em'}}>
          <IconButton className="delete-button"
            onClick={() => handleDeleteChange(true)}>
            <DeleteIcon />
          </IconButton>
        </FormControl>
      </div>

      {fetchError ?
        <div>
          {fetchError.publicToken ?
            <div style={{textAlign: 'center', marginBottom: '1.5em'}}>
              <Button
                onClick={() => onBankPlaidUpdate(fetchError.publicToken)}
                variant="contained"
                color="secondary"
                startIcon={<SyncIcon />}
              >
                Update Credentials
              </Button>
            </div> : null }

          <Alert severity="error">{getErrorMsg()}</Alert>
        </div> : null}

      {(accounts || []).map((account, j) =>
        <AccountFields key={j} account={account} payFroms={payFroms}
          onChange={changes => handleAccountChange(j, changes)}
        />)}
    </div>
  );
}


function AccountFields(props) {
  const { account, onChange, payFroms} = props;
  let { enabled, officialName, name, type, payFrom, errors} = account;

  const isCredit = type === 'credit';

  /*
   * XXX poor man validation.
   * It doesn't work well: the save button is still enabled when
   * we have validation errors.
   */
  if (!payFroms.map(b => b.id).includes(payFrom))
    payFrom = '';
  const payFromError = isCredit && enabled && !payFrom;

  const iconColor = enabled ? 'primary' : 'disabled';

  return (
    <div style={{display: 'flex', marginTop: '0.5em'}}>
      <FormControl style={{marginTop: 12}}>
        <Checkbox checked={enabled} color='primary'
          onChange={e => onChange({enabled: e.target.checked})}
        />
      </FormControl>

      <FormControl style={{flex: 1}}>
        <InputLabel style={{whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            width: "133%" /* 1/0.75 */}}>
          {officialName}
        </InputLabel>
        <Input
          value={name || ""}
          onChange={e => onChange({name: e.target.value})}
          placeholder="Nickname"
          startAdornment={
            <InputAdornment position="start">
              {isCredit ?
                <CreditCardIcon color={iconColor}/> :
                <AccountBalanceIcon color={iconColor}/>}
            </InputAdornment>}
        />
      </FormControl>

      {isCredit ?
        <FormControl style={{marginLeft: "1em", width: "12em"}} >
          <InputLabel error={payFromError}>Card payed from</InputLabel>
          <NativeSelect
            error={payFromError}
            value={payFrom}
            onChange={e => onChange({payFrom: e.target.value})}
          >
            <option value="" />
            {payFroms.map(s =>
              <option key={s.id} value={s.id}>{s.name || s.officialName}</option>)}
          </NativeSelect>
        </FormControl>
        : null}
    </div>
  );
}
