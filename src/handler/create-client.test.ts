import { DynamoDBDocument, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { CLIENT_DEFAULTS, ClientInput } from "../models/client";
import { handler } from "./create-client";
import { createApiGatewayEvent } from "./test-utils";
import { APIGatewayProxyResult, Context } from "aws-lambda";

process.env.ENVIRONMENT = "test";
describe("Create client endpoint tests", () => {
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

    const expectedClient = {
      ...testClientInput,
      ClientID: expect.any(String),
      Created: 1234567,
      LastModified: 1234567,
    };
    expect(response.statusCode).toEqual(201);
    const createdClient = JSON.parse(response.body);
    expect(createdClient).toEqual(expectedClient);
    expect(mockDynamo).toHaveReceivedCommandExactlyOnceWith(PutCommand, {
      TableName: "test-client-registry",
      Item: expectedClient,
      ConditionExpression: "attribute_not_exists(ClientID)",
    });
  });

  it("should return a 400 response if no client input in body provided", async () => {
    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("POST", "", {}, {}),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Client input not provided in body of request",
    });
  });

  it("should return a 400 response with validation errors for invalid client input", async () => {
    const invalidClientInput = {
      ...CLIENT_DEFAULTS,
      Scopes: [],
      RedirectUrls: [],
    };

    const response = await sendCreateClientRequest(invalidClientInput);

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "One or more validation errors were found",
      errors: [
        "Field RedirectUrls cannot be empty",
        'Scopes must contain "openid"',
      ],
    });
  });

  it("should return a 405 response if using wrong method", async () => {
    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, {}),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(405);
    expect(JSON.parse(response.body)).toEqual({
      message: "Method not allowed",
    });
  });

  it("should return a 500 response if dynamo throws an error", async () => {
    mockDynamo
      .on(PutCommand, {
        TableName: "test-client-registry",
        Item: CLIENT_DEFAULTS,
        ConditionExpression: "attribute_not_exists(ClientID)",
      })
      .rejects(new Error("Test dynamo error"));

    const response = await sendCreateClientRequest(CLIENT_DEFAULTS);

    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body)).toEqual({
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
