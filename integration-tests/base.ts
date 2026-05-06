import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { test as baseTest } from "vitest";
import { ClientService } from "../src/services/client-service";
import { Client } from "../src/models/client";

export const it = baseTest
  .extend("dynamoDocClient", async ({}, { onCleanup }) => {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
      endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT,
      credentials: {
        // We need to provide some credential values for DynamoDBLocal, so ignoring from detect-secrets
        accessKeyId: "test", // pragma: allowlist secret
        secretAccessKey: "test", // pragma: allowlist secret
      },
    });
    await createTable(dynamoClient);
    onCleanup(async () => await deleteTable(dynamoClient));
    return DynamoDBDocument.from(dynamoClient);
  })
  .extend("clientService", ({ dynamoDocClient }) => {
    return new ClientService(dynamoDocClient, "test");
  })
  .extend("addClientsToDynamo", ({ dynamoDocClient }) => {
    return async (...clients: Client[]) => {
      for (const client of clients) {
        await dynamoDocClient.put({
          TableName: "test-client-registry",
          Item: client,
        });
      }
    };
  })
  .extend("getClientFromDynamo", ({ dynamoDocClient }) => {
    return async (clientId: string) => {
      return (
        await dynamoDocClient.get({
          TableName: "test-client-registry",
          Key: { ClientID: clientId },
        })
      ).Item;
    };
  });

const createTable = async (dynamoClient: DynamoDBClient) => {
  const command = new CreateTableCommand({
    TableName: "test-client-registry",
    AttributeDefinitions: [
      {
        AttributeName: "ClientID",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "ClientID",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });
  await dynamoClient.send(command);
};

const deleteTable = async (dynamoClient: DynamoDBClient) => {
  const command = new DeleteTableCommand({
    TableName: "test-client-registry",
  });

  await dynamoClient.send(command);
};
