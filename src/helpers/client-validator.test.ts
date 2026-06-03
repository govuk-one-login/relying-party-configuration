import { createClient } from "../models/client";
import { allValidators } from "./client-validator";

describe("Client validator tests", () => {
  describe("URL validation for BackChannelLogoutUri", () => {
    it(`should return invalid result when BackChannelLogoutUri is not a legal URL`, async () => {
      const client = createClient({
        BackChannelLogoutUri: "/////not-a-url!",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field BackChannelLogoutUri is not a legal URL`,
      ]);
    });

    it(`should return invalid result when BackChannelLogoutUri has an invalid protocol`, async () => {
      const client = createClient({
        BackChannelLogoutUri: "http://test.com",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field BackChannelLogoutUri does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when BackChannelLogoutUri has a local hostname`, async () => {
      const client = createClient({
        BackChannelLogoutUri: "https://localhost",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field BackChannelLogoutUri is using a local hostname`,
      ]);
    });
  });
});
