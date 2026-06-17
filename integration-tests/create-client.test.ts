import { APIGatewayProxyResult, Context } from "aws-lambda";
import { handler } from "../src/handler/create-client";
import { createApiGatewayEvent } from "../src/handler/test-utils";
import { it } from "./base";
import { Client, CLIENT_DEFAULTS, ClientInput } from "../src/models/client";
import crypto from "crypto";

vi.spyOn(crypto, "randomBytes").mockImplementation(() =>
  Buffer.from("generated-client-id", "utf8"),
);

describe("Create client endpoint integration tests", () => {
  const TEST_TIMESTAMP = 1234567890;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TEST_TIMESTAMP));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a 200 response with client if client does not exist yet", async ({
    getClientFromDynamo,
  }) => {
    const response = await sendCreateClientRequest(CLIENT_DEFAULTS);

    const expectedClient = {
      ...CLIENT_DEFAULTS,
      clientId: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
      created: 1234567,
      lastModified: 1234567,
    };
    expect(response.statusCode).toEqual(201);
    const createdClient = JSON.parse(response.body) as Client;
    expect(createdClient).toEqual(expectedClient);
    expect(await getClientFromDynamo(createdClient.clientId)).toEqual(
      expectedClient,
    );
  });

  it("should return a 400 response with errors if client is invalid", async () => {
    const invalidClient = {
      ...CLIENT_DEFAULTS,
      redirectUrls: [],
      scopes: [],
    };
    const response = await sendCreateClientRequest(invalidClient);

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "One or more validation errors were found",
      errors: [
        "Field redirectUrls cannot be empty",
        'scopes must contain "openid"',
      ],
    });
  });

  it("should return a 500 response if client already exists with same ID", async ({
    addClientsToDynamo,
  }) => {
    const existingClient = {
      ...CLIENT_DEFAULTS,
      clientId: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
      created: 1234567890,
      lastModified: 1234567890,
    };
    await addClientsToDynamo(existingClient);

    const response = await sendCreateClientRequest(existingClient);

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
