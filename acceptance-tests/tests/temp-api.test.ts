import { test, expect } from "@playwright/test";
import { getBaseUrl } from "../utils/get-base-url.js";

test("should call get client endpoint", async ({ request }) => {
  const tempApiResult = await request.get(`${getBaseUrl()}/clients/123`);
  expect(await tempApiResult.json()).toEqual(
    expect.objectContaining({
      message: "Client not found",
    }),
  );
});
