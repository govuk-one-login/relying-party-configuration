import { GetCommand, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { createClient } from "../models/client";
import { handler } from "./get-client";
import { createApiGatewayEvent } from "./test-utils";
import { APIGatewayProxyResult, Context } from "aws-lambda";

process.env.ENVIRONMENT = "test";
const TEST_CLIENT = createClient({ clientId: "test-client-id" });
describe("Get client endpoint tests", () => {
  const mockDynamo = mockClient(DynamoDBDocument);

  beforeEach(() => {
    mockDynamo.reset();
  });

  it("should return a 200 response with client if client exists", async () => {
    mockGetClient(TEST_CLIENT.clientId).resolves({
      Item: TEST_CLIENT,
    });

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, { id: TEST_CLIENT.clientId }),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual(TEST_CLIENT);
  });

  it("should return a 400 response if client ID parameter is missing", async () => {
    mockGetClient(TEST_CLIENT.clientId).resolves({
      Item: TEST_CLIENT,
    });

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, {}),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "Client ID path parameter not found",
    });
  });

  it("should return a 404 response if client does not exist", async () => {
    mockGetClient("not-a-client-id").resolves({
      Item: undefined,
    });

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, { id: "not-a-client-id" }),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(404);
    expect(JSON.parse(response.body)).toEqual({
      message: "Client not found",
    });
  });

  it("should return a 405 response if using wrong method", async () => {
    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("POST", "", {}, {}, {}),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(405);
    expect(JSON.parse(response.body)).toEqual({
      message: "Method not allowed",
    });
  });

  it("should return a 500 response if dynamo throws error", async () => {
    mockGetClient(TEST_CLIENT.clientId).rejects(new Error("Test dynamo error"));

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, { id: TEST_CLIENT.clientId }),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "Internal server error",
    });
  });

  const mockGetClient = (clientId: string) => {
    return mockDynamo.on(GetCommand, {
      TableName: "test-client-registry",
      Key: {
        clientId,
      },
    });
  };
});
