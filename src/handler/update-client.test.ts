import { DynamoDBDocument, PutCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { Client, createClient } from "../models/client";
import { handler } from "./update-client";
import { createApiGatewayEvent } from "./test-utils";
import { APIGatewayProxyResult, Context } from "aws-lambda";

process.env.ENVIRONMENT = "test";
describe("Update client endpoint tests", () => {
  const mockDynamo = mockClient(DynamoDBDocument);
  const TEST_TIMESTAMP = 156789000;

  beforeEach(() => {
    mockDynamo.reset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TEST_TIMESTAMP));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a 200 response with updated client if provided with valid client input", async () => {
    const existingClient = createClient({ clientId: "test-client-id" });

    const updatedClient: Client = {
      ...existingClient,
      scopes: ["openid", "phone", "email"],
    };
    const response = await sendUpdateClientRequest(updatedClient);

    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual({
      ...updatedClient,
      lastModified: 156789,
    });
  });

  it("should return a 400 response if no client id path parameter provided in body provided", async () => {
    const response: APIGatewayProxyResult = (await handler(
      createApiGatewayEvent("PUT", "", {}, {}, {}),
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Client ID path parameter not found",
    });
  });

  it("should return a 400 response if no client input in body provided", async () => {
    const response: APIGatewayProxyResult = (await handler(
      createApiGatewayEvent("PUT", "", {}, {}, { id: "test-client-id" }),
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Client not provided in body of request",
    });
  });

  it("should return a 400 response with errors if client is invalid", async () => {
    const existingClient = createClient({ clientId: "test-client-id" });

    const invalidClient = {
      ...existingClient,
      redirectUrls: [],
      scopes: [],
    };
    const response = await sendUpdateClientRequest(invalidClient);

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
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

    expect(response.statusCode).toEqual(405);
    expect(JSON.parse(response.body)).toEqual({
      message: "Method not allowed",
    });
  });

  it("should return a 500 response if dynamo throws an error", async () => {
    const testClient = createClient({ clientId: "test-client-id" });
    mockDynamo.on(PutCommand).rejects(new Error("Test dynamo error"));

    const response: APIGatewayProxyResult = (await handler(
      createApiGatewayEvent(
        "PUT",
        JSON.stringify(testClient),
        {},
        {},
        { id: testClient.clientId },
      ),
      {} as Context,
      () => {},
    )) as APIGatewayProxyResult;

    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "Internal server error",
    });
  });

  const sendUpdateClientRequest = async (
    client: Client,
  ): Promise<APIGatewayProxyResult> => {
    return (await handler(
      createApiGatewayEvent(
        "PUT",
        JSON.stringify(client),
        {},
        {},
        { id: client.clientId },
      ),
      {} as Context,
      () => {},
    )) as Promise<APIGatewayProxyResult>;
  };
});
