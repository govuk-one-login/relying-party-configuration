import {
  CreateTableCommand,
  DeleteTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Client, CLIENT_DEFAULTS, createClient } from "../src/models/client";
import {
  ClientService,
  ClientServiceError,
} from "../src/services/client-service";

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT,
  credentials: {
    // We need to provide some credential values for DynamoDBLocal, so ignoring from detect-secrets
    accessKeyId: "test", // pragma: allowlist secret
    secretAccessKey: "test", // pragma: allowlist secret
  },
});
const dynamoDocClient = DynamoDBDocument.from(dynamoClient);
const clientService = new ClientService(dynamoDocClient);
describe("Client service integration test", async () => {
  beforeEach(async () => {
    await createTable();
  });
  afterEach(async () => {
    await deleteTable();
  });

  describe("Get client by ID tests", () => {
    it("should get client by ID", async () => {
      const testClient = createClient("test-client-id");
      await addClientToDynamo(testClient);

      const actualClient = await clientService.getClient("test-client-id");

      expect(actualClient).toEqual(testClient);
    });

    it("should not get client if client does not exist with ID", async () => {
      const actualClient = await clientService.getClient("test-client-id");

      expect(actualClient).toBeUndefined();
    });
  });
  describe("Get client summaries", () => {
    it("should get first page of client summaries (less clients than page size)", async () => {
      const testClient = createClient("test-client-id");
      await addClientToDynamo(testClient);

      const actualClients = await clientService.getClientSummaries(1, 5);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 1,
        clients: [
          { ClientID: testClient.ClientID, ClientName: testClient.ClientName },
        ],
      });
    });

    it("should get first page of client summaries (more clients than page size)", async () => {
      const testClient1 = createClient("test-client-id-1");
      const testClient2 = createClient("test-client-id-2");
      const testClient3 = createClient("test-client-id-3");
      await addClientToDynamo(testClient1);
      await addClientToDynamo(testClient2);
      await addClientToDynamo(testClient3);

      const actualClients = await clientService.getClientSummaries(1, 2);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 2,
        totalPages: 2,
        totalClients: 3,
        clients: [
          {
            ClientID: testClient2.ClientID,
            ClientName: testClient2.ClientName,
          },
          {
            ClientID: testClient1.ClientID,
            ClientName: testClient1.ClientName,
          },
        ],
      });
    });

    it("should get second page of client summaries (more clients than page size)", async () => {
      const testClient1 = createClient("test-client-id-1");
      const testClient2 = createClient("test-client-id-2");
      const testClient3 = createClient("test-client-id-3");
      await addClientToDynamo(testClient1);
      await addClientToDynamo(testClient2);
      await addClientToDynamo(testClient3);

      const actualClients = await clientService.getClientSummaries(2, 2);

      expect(actualClients).toEqual({
        pageNumber: 2,
        pageSize: 2,
        totalPages: 2,
        totalClients: 3,
        clients: [
          {
            ClientID: testClient3.ClientID,
            ClientName: testClient3.ClientName,
          },
        ],
      });
    });

    it("should get no client summaries (no clients exist)", async () => {
      const actualClients = await clientService.getClientSummaries(1, 5);

      expect(actualClients).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 0,
        clients: [],
      });
    });
  });

  describe("Create client", () => {
    it("should create client", async () => {
      const testClient = await clientService.createClient(CLIENT_DEFAULTS);

      expect(
        (
          await dynamoDocClient.get({
            TableName: "test-client-registry",
            Key: { ClientID: testClient.ClientID },
          })
        ).Item,
      ).toEqual(testClient);
    });

    it("should fail to create client if client already exists", async () => {
      await dynamoDocClient.put({
        TableName: "test-client-registry",
        Item: {
          ...CLIENT_DEFAULTS,
          ClientID: "test-client-id",
        },
      });

      await expect(() =>
        clientService.createClientWithId("test-client-id", CLIENT_DEFAULTS),
      ).rejects.toThrow(ClientServiceError);
    });
  });
});

const addClientToDynamo = async (client: Client) => {
  await dynamoDocClient.put({
    TableName: "test-client-registry",
    Item: client,
  });
};

const createTable = async () => {
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
const deleteTable = async () => {
  const command = new DeleteTableCommand({
    TableName: "test-client-registry",
  });

  await dynamoClient.send(command);
};
