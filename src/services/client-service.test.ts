import {
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { CLIENT_DEFAULTS, createClient } from "../models/client";
import {
  getClient,
  getClientSummaries,
  putClient,
  updateClient,
} from "./client-service";

const TEST_CLIENT = createClient({ clientId: "abcd1234" });
const TABLE_PREFIX = "test";
describe("Client service tests", () => {
  const mockDynamo = mockClient(DynamoDBDocument);
  const TEST_TIMESTAMP = 1234567890;

  beforeEach(() => {
    mockDynamo.reset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TEST_TIMESTAMP));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Get client by clientId", () => {
    it("should get client from dynamo", async () => {
      mockDynamo
        .on(GetCommand, {
          TableName: `${TABLE_PREFIX}-client-registry`,
          Key: {
            clientId: TEST_CLIENT.clientId,
          },
        })
        .resolves({
          Item: TEST_CLIENT,
        });

      const result = await getClient(TEST_CLIENT.clientId);
      expect(result).toEqual(TEST_CLIENT);
    });

    it("should get no client if client does not exist in dynamo", async () => {
      mockDynamo
        .on(GetCommand, {
          TableName: `${TABLE_PREFIX}-client-registry`,
          Key: {
            clientId: "not-a-client-id",
          },
        })
        .resolves({});

      const result = await getClient("not-a-client-id");
      expect(result).toBeUndefined();
    });
  });

  describe("Get all clients", () => {
    it("should get client summaries from dynamo with one page", async () => {
      mockDynamo
        .on(ScanCommand, {
          TableName: `${TABLE_PREFIX}-client-registry`,
          Limit: 5,
        })
        .resolves({
          Items: [TEST_CLIENT],
        });

      const result = await getClientSummaries(1, 5);
      expect(result).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 1,
        clients: [
          {
            clientId: TEST_CLIENT.clientId,
            clientName: TEST_CLIENT.clientName,
          },
        ],
      });
    });

    it("should get no client summaries from dynamo", async () => {
      mockDynamo
        .on(ScanCommand, {
          TableName: `${TABLE_PREFIX}-client-registry`,
          Limit: 5,
        })
        .resolves({
          Items: [],
        });
      const result = await getClientSummaries(1, 5);
      expect(result).toEqual({
        pageNumber: 1,
        pageSize: 5,
        totalPages: 1,
        totalClients: 0,
        clients: [],
      });
    });
  });

  describe("Create client", () => {
    it("should create a client", async () => {
      const client = createClient();
      await putClient(client);

      expect(mockDynamo).toHaveReceivedCommandExactlyOnceWith(PutCommand, {
        Item: {
          ...CLIENT_DEFAULTS,
          clientId: expect.any(String) as string,
          created: 1234567,
          lastModified: 1234567,
        },
        TableName: `${TABLE_PREFIX}-client-registry`,
        ConditionExpression: "attribute_not_exists(clientId)",
      });
    });
  });

  describe("Update client", () => {
    it("should update a client", async () => {
      const clientToUpdate = createClient({
        clientId: "test-client-id",
        created: 100000,
      });
      await updateClient(clientToUpdate);

      expect(mockDynamo).toHaveReceivedCommandExactlyOnceWith(PutCommand, {
        Item: {
          ...CLIENT_DEFAULTS,
          clientId: "test-client-id",
          created: 100000,
          lastModified: 1234567,
        },
        TableName: `${TABLE_PREFIX}-client-registry`,
        ConditionExpression: "attribute_exists(clientId)",
      });
    });
  });
});
