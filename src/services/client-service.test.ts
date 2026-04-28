import {
  DynamoDBDocument,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { ClientService } from "./client-service";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CLIENT_DEFAULTS, createClient } from "../models/client";

process.env.ENVIRONMENT = "test";

const TEST_CLIENT = createClient("abcd1234");
describe("Client service tests", () => {
  const mockDynamo = mockClient(DynamoDBDocument);
  const clientService = new ClientService(
    DynamoDBDocument.from(new DynamoDBClient({})),
  );
  beforeEach(() => {
    mockDynamo.reset();
  });

  describe("Get client by clientId", () => {
    it("should get client from dynamo", async () => {
      mockDynamo
        .on(GetCommand, {
          TableName: "test-client-registry",
          Key: {
            ClientID: TEST_CLIENT.ClientID,
          },
        })
        .resolves({
          Item: TEST_CLIENT,
        });

      const result = await clientService.getClient(TEST_CLIENT.ClientID);
      expect(result).toEqual(TEST_CLIENT);
    });

    it("should get no client if client does not exist in dynamo", async () => {
      mockDynamo
        .on(GetCommand, {
          TableName: "test-client-registry",
          Key: {
            ClientID: "not-a-client-id",
          },
        })
        .resolves({});

      const result = await clientService.getClient("not-a-client-id");
      expect(result).toBeUndefined();
    });
  });

  describe("Get all clients", () => {
    it("should get client summaries from dynamo with one page", async () => {
      mockDynamo
        .on(ScanCommand, {
          TableName: "test-client-registry",
          Limit: 5,
        })
        .resolves({
          Items: [TEST_CLIENT],
        });

      const result = await clientService.getClientSummaries(1, 5);
      expect(result).toContainEqual({
        ClientID: TEST_CLIENT.ClientID,
        ClientName: TEST_CLIENT.ClientName,
      });
    });

    it("should get no client summaries from dynamo", async () => {
      mockDynamo
        .on(ScanCommand, {
          TableName: "test-client-registry",
          Limit: 5,
        })
        .resolves({
          Items: [],
        });
      const result = await clientService.getClientSummaries(1, 5);
      expect(result.length).toEqual(0);
    });
  });

  describe("Create client", () => {
    it("should create a client", async () => {
      await clientService.createClient(CLIENT_DEFAULTS);

      expect(mockDynamo).toHaveReceivedCommandExactlyOnceWith(PutCommand, {
        Item: {
          ...CLIENT_DEFAULTS,
          ClientID: expect.any(String),
        },
        TableName: "test-client-registry",
        ConditionExpression: "attribute_not_exists(ClientID)",
      });
    });
  });

  describe("Update client", () => {
    it("should update a client", async () => {
      await clientService.updateClient("test-client-id", CLIENT_DEFAULTS);

      expect(mockDynamo).toHaveReceivedCommandExactlyOnceWith(PutCommand, {
        Item: {
          ...CLIENT_DEFAULTS,
          ClientID: "test-client-id",
        },
        TableName: "test-client-registry",
        ConditionExpression: "attribute_exists(ClientID)",
      });
    });
  });
});
