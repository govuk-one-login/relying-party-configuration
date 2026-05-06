import { APIGatewayProxyResult, Context } from "aws-lambda";
import { handler } from "../src/handler/get-client";
import { createApiGatewayEvent } from "../src/handler/test-utils";
import { createClient } from "../src/models/client";
import { it } from "./base";

const TEST_CLIENT = createClient("abcd1234");
describe("Get client endpoint integration tests", () => {
  it("should return a 200 response with client if client exists", async ({
    addClientsToDynamo,
  }) => {
    await addClientsToDynamo(TEST_CLIENT);

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, { id: TEST_CLIENT.ClientID }),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual(TEST_CLIENT);
  });

  it("should return a 400 response if client ID parameter is missing", async ({
    addClientsToDynamo,
  }) => {
    await addClientsToDynamo(TEST_CLIENT);

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

  it("should return a 404 response if client does not exist", async ({
    addClientsToDynamo,
  }) => {
    await addClientsToDynamo(TEST_CLIENT);

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

  it("should return a 405 response if using wrong method", async ({
    addClientsToDynamo,
  }) => {
    await addClientsToDynamo(TEST_CLIENT);

    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("POST", "", {}, {}, { id: TEST_CLIENT.ClientID }),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(405);
    expect(JSON.parse(response.body)).toEqual({
      message: "Method not allowed",
    });
  });

  it("should return a 500 response if dynamo throws error", async () => {
    // Not using any test context variables defined in base.ts
    // This means the createTable/destroyTable hooks aren't called
    // so the table does not exist, which is why this test returns a 500
    const response: APIGatewayProxyResult = await handler(
      createApiGatewayEvent("GET", "", {}, {}, { id: "not-a-client-id" }),
      {} as Context,
      () => {},
    );

    expect(response.statusCode).toEqual(500);
    expect(JSON.parse(response.body)).toEqual({
      message: "Internal server error",
    });
  });
});
