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
    const dynamoClient = new DynamoDBClient({});
    await createTable(dynamoClient);
    onCleanup(async () => await deleteTable(dynamoClient));
    return DynamoDBDocument.from(dynamoClient);
  })
  .extend("clientService", ({ dynamoDocClient }) => {
    return new ClientService(dynamoDocClient, process.env.VITEST_WORKER_ID);
  })
  .extend("addClientsToDynamo", ({ dynamoDocClient }) => {
    return async (...clients: Client[]) => {
      for (const client of clients) {
        await dynamoDocClient.put({
          TableName: `${process.env.VITEST_WORKER_ID}-client-registry`,
          Item: client,
        });
      }
    };
  })
  .extend("getClientFromDynamo", ({ dynamoDocClient }) => {
    return async (clientId: string) => {
      return (
        await dynamoDocClient.get({
          TableName: `${process.env.VITEST_WORKER_ID}-client-registry`,
          Key: { clientId: clientId },
        })
      ).Item;
    };
  });

const createTable = async (dynamoClient: DynamoDBClient) => {
  const command = new CreateTableCommand({
    TableName: `${process.env.VITEST_WORKER_ID}-client-registry`,
    AttributeDefinitions: [
      {
        AttributeName: "clientId",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "clientId",
        KeyType: "HASH",
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  });
  await dynamoClient.send(command);
};

const deleteTable = async (dynamoClient: DynamoDBClient) => {
  const command = new DeleteTableCommand({
    TableName: `${process.env.VITEST_WORKER_ID}-client-registry`,
  });

  await dynamoClient.send(command);
};
