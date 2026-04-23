import { test, expect } from "@playwright/test";
import { getBaseUrl } from "../utils/get-base-url.js";

test("should call temp api endpoint", async ({ request }) => {
  const tempApiResult = await request.get(`${getBaseUrl()}/temp-api`);
  expect(await tempApiResult.json()).toEqual(
    expect.objectContaining({
      message: "Hello World",
    }),
  );
});
