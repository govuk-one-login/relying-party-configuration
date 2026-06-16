import { APIGatewayProxyResult, Context } from "aws-lambda";
import { handler } from "../src/handler/update-client";
import { createApiGatewayEvent } from "../src/handler/test-utils";
import { it } from "./base";
import {
  Client,
  CLIENT_DEFAULTS,
  createClient,
  Scope,
} from "../src/models/client";
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
      clientId: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
    });
    await addClientsToDynamo(existingClient);

    const updatedClient = {
      ...existingClient,
      scopes: ["openid", "phone", "email"] as Scope[],
    };
    const response = await sendUpdateClientRequest(updatedClient);

    const expectedClient = {
      ...updatedClient,
      created: 123456,
      lastModified: TEST_TIMESTAMP / 1000,
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
      clientId: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
    });
    await addClientsToDynamo(existingClient);

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

  it("should return a 500 response if client already exists with same ID", async ({
    addClientsToDynamo,
  }) => {
    const existingClient = {
      ...CLIENT_DEFAULTS,
      clientId: "a-different-client-id",
      created: 1234567890,
      lastModified: 1234567890,
    };
    await addClientsToDynamo(existingClient);

    const testClient = createClient({
      clientId: "client-id-that-does-not-exist",
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
        { id: client.clientId },
      ),
      {} as Context,
      () => {},
    )) as Promise<APIGatewayProxyResult>;
  };
});
