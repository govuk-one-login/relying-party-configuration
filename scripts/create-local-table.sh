#!/bin/bash

export AWS_ENDPOINT_URL_DYNAMODB=http://host.docker.internal:8000
export AWS_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test # pragma: allowlist secret
export AWS_SECRET_ACCESS_KEY=test # pragma: allowlist secret

aws dynamodb create-table \
   --table-name local-client-registry \
   --attribute-definitions \
      AttributeName=clientId,AttributeType=S \
      AttributeName=clientName,AttributeType=S \
   --key-schema \
      AttributeName=clientId,KeyType=HASH \
   --provisioned-throughput \
      ReadCapacityUnits=5,WriteCapacityUnits=5 \
   --global-secondary-indexes \
      '[{"IndexName":"ClientNameIndex","KeySchema":[{"AttributeName":"clientName","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"},"ProvisionedThroughput":{"ReadCapacityUnits":5,"WriteCapacityUnits":5}}]' \
