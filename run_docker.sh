#!/bin/sh
set -eu

docker build . -t easy-finance:latest

echo PLAID_CLIENT_ID=$PLAID_CLIENT_ID > docker-env
echo PLAID_SECRET=$PLAID_SECRET >> docker-env
echo PLAID_PUBLIC_KEY=$PLAID_PUBLIC_KEY >> docker-env
echo PLAID_ENV=$PLAID_ENV >> docker-env
echo FIREBASE_SERVICE_ACCOUNT_JSON_FILE=$FIREBASE_SERVICE_ACCOUNT_JSON_FILE >> docker-env
echo FIREBASE_DB_URL=$FIREBASE_DB_URL >> docker-env
echo FIREBASE_SERVICE_ACCOUNT=$FIREBASE_SERVICE_ACCOUNT >> docker-env
echo PASSWORD_SHA1=$PASSWORD_SHA1 >> docker-env

docker run --env-file docker-env -p 3000:3000 "$@" easy-finance:latest
