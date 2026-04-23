import path from "node:path";
import { defineConfig } from "@playwright/test";
import { env } from "./env.js";
const getHost = () => {
  if (env.TEST_TARGET === "local") {
    return "localhost";
  }
  return `${env.API_GW_ID}-${env.VPCE_ID}.execute-api.eu-west-2.amazonaws.com`;
};
export default defineConfig({
  testDir: "tests",
  preserveOutput: "failures-only",
  workers: "50%",
  reporter: env.TEST_REPORT_DIR
    ? [
        // See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline#Test-reports
        ["json", { outputFile: path.join(env.TEST_REPORT_DIR, "report.json") }],
      ]
    : "list",
  use: {
    extraHTTPHeaders: {
      Host: getHost(),
      Accept: "application/json",
    },
  },
});
