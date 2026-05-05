import "dotenv/config";
import * as v from "valibot";

const envSchema = v.object({
  TEST_TARGET: v.fallback(
    v.union([v.literal("local"), v.literal("dev"), v.literal("build")]),
    "local",
  ),
  TEST_REPORT_DIR: v.optional(v.string()),
  API_GW_URL: v.optional(v.string()),
  API_GW_ID: v.optional(v.string()),
  VPCE_ID: v.optional(v.string()),
});

export const env = v.parse(envSchema, {
  ...process.env,
  // See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline#Getting-details-about-the-target-environments
  TEST_TARGET: process.env.TEST_ENVIRONMENT,
  TEST_REPORT_DIR:
    process.env.TEST_REPORT_ABSOLUTE_DIR ?? process.env.TEST_REPORT_DIR,
});
