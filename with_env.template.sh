#!/bin/sh

# Pick a hard to guess password
export PASSWORD=XXX

# Fill in the plaid account information
export PLAID_CLIENT_ID=XXX
export PLAID_SECRET=XXX
export PLAID_PUBLIC_KEY=XXX
export PLAID_ENV=development

# the service-account-key.json file is obtained by clicking
# on "Generate new private key" in Settings -> service accounts.
export FIREBASE_SERVICE_ACCOUNT_JSON_FILE=service-account-key.json
export FIREBASE_DB_URL=https://XXX.firebaseio.com

# No need to touch further down.
########################################

export FIREBASE_SERVICE_ACCOUNT=`cat $FIREBASE_SERVICE_ACCOUNT_JSON_FILE | base64`
export PASSWORD_SHA1=`echo -n pwsalt${PASSWORD} | openssl sha1`
unset PASSWORD
