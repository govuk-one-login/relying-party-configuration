import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { test as baseTest } from "vitest";
import { Client } from "../src/models/client";
import { logger } from "../src/logger";

export const it = baseTest
  .extend("dynamoClient", async ({}) => {
    return new DynamoDBClient({
      region: "eu-west-2",
      ...(process.env.DYNAMO_ENDPOINT && {
        endpoint: process.env.DYNAMO_ENDPOINT,
      }),
    });
  })
  .extend("dynamoDocClient", async ({ dynamoClient }) => {
    return DynamoDBDocument.from(dynamoClient);
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
it.beforeEach(async ({ dynamoClient }) => {
  await createTable(dynamoClient);
});
it.afterEach(async ({ dynamoClient }) => {
  try {
    await deleteTable(dynamoClient);
  } catch (err) {
    logger.info("Table does not exist");
  }
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
