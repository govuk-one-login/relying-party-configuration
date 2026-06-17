import { DynamoDBDocument, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { Client, CLIENT_DEFAULTS, ClientInput } from "../models/client";
import { handler } from "./create-client";
import { createApiGatewayEvent } from "./test-utils";
import { APIGatewayProxyResult, Context } from "aws-lambda";

process.env.ENVIRONMENT = "test";

describe("create client endpoint tests", () => {
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

  it("should return a 200 response with client if provided with valid client input", async () => {
    const testClientInput = CLIENT_DEFAULTS;

    const response = await sendCreateClientRequest(testClientInput);

    const expectedClient: Client = {
      ...testClientInput,
      clientId: expect.any(String) as string,
      created: 1234567,
      lastModified: 1234567,
    };

    const createdClient: Client = JSON.parse(response.body) as Client;

    expect(response.statusCode).toBe(201);
    expect(createdClient).toStrictEqual(expectedClient);
    expect(mockDynamo).toHaveReceivedCommandExactlyOnceWith(PutCommand, {
      TableName: "test-client-registry",
      Item: expectedClient,
      ConditionExpression: "attribute_not_exists(clientId)",
    });
  });

  it("should return a 400 response if no client input in body provided", async () => {
    const response: APIGatewayProxyResult = (await handler(
      createApiGatewayEvent("POST", "", {}, {}),
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "Client input not provided in body of request",
    });
  });

  it("should return a 400 response with validation errors for invalid client input", async () => {
    const invalidClientInput = {
      ...CLIENT_DEFAULTS,
      scopes: [],
      redirectUrls: [],
    };

    const response = await sendCreateClientRequest(invalidClientInput);

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "One or more validation errors were found",
      errors: [
        "Field redirectUrls cannot be empty",
        'scopes must contain "openid"',
      ],
    });
  });

  it("should return a 405 response if using wrong method", async () => {
    const response: APIGatewayProxyResult = (await handler(
      createApiGatewayEvent("GET", "", {}, {}, {}),
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "Method not allowed",
    });
  });

  it("should return a 500 response if dynamo throws an error", async () => {
    mockDynamo
      .on(PutCommand, {
        TableName: "test-client-registry",
        Item: CLIENT_DEFAULTS,
        ConditionExpression: "attribute_not_exists(clientId)",
      })
      .rejects(new Error("Test dynamo error"));

    const response = await sendCreateClientRequest(CLIENT_DEFAULTS);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toStrictEqual({
      message: "Internal server error",
    });
  });

  const sendCreateClientRequest = async (
    clientInput: ClientInput,
  ): Promise<APIGatewayProxyResult> => {
    return (await handler(
      createApiGatewayEvent("POST", JSON.stringify(clientInput), {}, {}, {}),
      {} as Context,
      () => {},
    )) as Promise<APIGatewayProxyResult>;
  };
});
