import { APIGatewayProxyResult, Context } from "aws-lambda";
import { handler } from "../src/handler/update-client";
import { createApiGatewayEvent } from "../src/handler/test-utils";
import { it } from "./base";
import { Client, CLIENT_DEFAULTS, createClient } from "../src/models/client";
import crypto from "crypto";

vi.spyOn(crypto, "randomBytes").mockReturnValue(
  Buffer.from("generated-client-id", "utf8") as any,
);

describe("Update client endpoint integration tests", () => {
  const TEST_TIMESTAMP = 156789000;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TEST_TIMESTAMP));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return a 200 response with client if client exists", async ({
    addClientsToDynamo,
    getClientFromDynamo,
  }) => {
    const existingClient = createClient({
      ClientID: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
    });
    await addClientsToDynamo(existingClient);

    const updatedClient = {
      ...existingClient,
      Scopes: ["openid", "phone", "email"],
    };
    const response = await sendUpdateClientRequest(updatedClient);

    const expectedClient = {
      ...updatedClient,
      Created: 123456,
      LastModified: TEST_TIMESTAMP / 1000,
    };
    expect(response.statusCode).toEqual(200);
    const createdClient = JSON.parse(response.body);
    expect(createdClient).toEqual(expectedClient);
    expect(await getClientFromDynamo("Z2VuZXJhdGVkLWNsaWVudC1pZA")).toEqual(
      expectedClient,
    );
  });

  it("should return a 400 response with errors if client is invalid", async ({
    addClientsToDynamo,
  }) => {
    const existingClient = createClient({
      ClientID: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
    });
    await addClientsToDynamo(existingClient);

    const invalidClient = {
      ...existingClient,
      RedirectUrls: [],
      Scopes: [],
    };
    const response = await sendUpdateClientRequest(invalidClient);

    expect(response.statusCode).toEqual(400);
    expect(JSON.parse(response.body)).toEqual({
      message: "One or more validation errors were found",
      errors: [
        "Field RedirectUrls cannot be empty",
        'Scopes must contain "openid"',
      ],
    });
  });

  it("should return a 500 response if client already exists with same ID", async ({
    addClientsToDynamo,
  }) => {
    const existingClient = {
      ...CLIENT_DEFAULTS,
      ClientID: "a-different-client-id",
      Created: 1234567890,
      LastModified: 1234567890,
    };
    await addClientsToDynamo(existingClient);

    const testClient = createClient({
      ClientID: "client-id-that-does-not-exist",
    });
    const response = await sendUpdateClientRequest(testClient);

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
        { id: client.ClientID },
      ),
      {} as Context,
      () => {},
    )) as Promise<APIGatewayProxyResult>;
  };
});
