#!/bin/bash

set -euo pipefail

function get_env_vars_from_SSM() {

  echo "Getting environment variables from SSM ... "
  VARS="$(aws ssm get-parameters-by-path --with-decryption --path /tests/$TEST_ENVIRONMENT-api-deploy/ | jq -r '.Parameters[] | @base64')"
  for VAR in $VARS; do
    VAR_NAME="$(echo ${VAR} | base64 -d | jq -r '.Name / "/" | .[3]')"
    export "$VAR_NAME"="$(echo ${VAR} | base64 -d | jq -r '.Value')"
  done
  echo "Export SSM parameters completed."
}

get_env_vars_from_SSM
export API_GW_URL="https://$API_GW_ID-$VPCE_ID.execute-api.eu-west-2.amazonaws.com/$TEST_ENVIRONMENT"
echo "Using API GW URL: $API_GW_URL"

curl -i -v "https://$API_GW_ID-$VPCE_ID.execute-api.eu-west-2.amazonaws.com/$TEST_ENVIRONMENT/temp-api"

TEST_EXIT_CODE=0
npm run test || TEST_EXIT_CODE=$?

exit $TEST_EXIT_CODE
