import { APIGatewayProxyResult, Context } from "aws-lambda";
import { handler } from "../src/handler/update-client";
import { createApiGatewayEvent } from "../src/handler/test-utils";
import { it } from "./base";
import { CLIENT_DEFAULTS, createClient } from "../src/models/client";
import crypto from "crypto";

vi.spyOn(crypto, "randomBytes").mockReturnValue(
  Buffer.from("generated-client-id", "utf8") as any,
);

describe("Create client endpoint integration tests", () => {
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
    const testClient = createClient("Z2VuZXJhdGVkLWNsaWVudC1pZA");
    await addClientsToDynamo(testClient);

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent(
        "PUT",
        JSON.stringify({
          ...testClient,
          Scopes: ["openid", "phone", "email"],
        }),
        {},
        {},
        { id: "Z2VuZXJhdGVkLWNsaWVudC1pZA" },
      ),
      {} as Context,
      () => {},
    );

    const expectedClient = {
      ...CLIENT_DEFAULTS,
      ClientID: "Z2VuZXJhdGVkLWNsaWVudC1pZA",
      Created: 123456,
      LastModified: TEST_TIMESTAMP / 1000,
      Scopes: ["openid", "phone", "email"],
    };
    expect(response.statusCode).toEqual(200);
    const createdClient = JSON.parse(response.body);
    expect(createdClient).toEqual(expectedClient);
    expect(await getClientFromDynamo("Z2VuZXJhdGVkLWNsaWVudC1pZA")).toEqual(
      expectedClient,
    );
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

    const testClient = createClient("client-id-that-does-not-exist");
    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent(
        "PUT",
        JSON.stringify({
          ...testClient,
          Scopes: ["openid", "phone", "email"],
        }),
        {},
        {},
        { id: "client-id-that-does-not-exist" },
      ),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "Internal server error",
    });
  });
});
