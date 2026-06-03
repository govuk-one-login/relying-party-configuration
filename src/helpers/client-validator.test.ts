import {
  Channel,
  Claim,
  ClientType,
  createClient,
  IdTokenSigningAlgorithm,
  LevelOfConfidence,
} from "../models/client";
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

  it("should return invalid result when Channel is not valid", async () => {
    const client = createClient({
      Channel: "not-a-channel" as unknown as Channel,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid Channel provided: "not-a-channel"',
    ]);
  });

  it("should return invalid result when Claims contains invalid claim", async () => {
    const client = createClient({
      Claims: ["not-a-claim"] as unknown as Claim[],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid Claim provided: "not-a-claim"',
    ]);
  });

  it("should return invalid result when ClientLoCs contains invalid ClientLoC", async () => {
    const client = createClient({
      ClientLoCs: ["not-an-loc"] as unknown as LevelOfConfidence[],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid ClientLoC provided: "not-an-loc"',
    ]);
  });

  it("should return invalid result when ClientLoCs contains identity LoC but identity is disabled", async () => {
    const client = createClient({
      ClientLoCs: ["P2"],
      IdentityVerificationSupported: false,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "Identity is disabled but ClientLoCs contain identity LoCs",
    ]);
  });

  it("should return invalid result when ClientName has an invalid length", async () => {
    const client = createClient({
      ClientName: "a".repeat(255),
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "ClientName must have between 1 and 255 characters",
    ]);
  });

  it("should return invalid result when ClientName has non-ASCII characters", async () => {
    const client = createClient({
      ClientName: "My 🆕 Client",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "ClientName must ONLY include ASCII characters",
    ]);
  });

  it("should return invalid result when ClientName starts with a colon", async () => {
    const client = createClient({
      ClientName: ":My Test Client",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons(["ClientName must not start with a :"]);
  });

  it("should return invalid result when ClientName has only whitespace characters", async () => {
    const client = createClient({
      ClientName: "    \t\t\n\n   ",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "ClientName must include at least one non-whitespace character",
    ]);
  });

  it("should return invalid result when ClientSecret is empty when TokenAuthMethod is client_secret_post", async () => {
    const client = createClient({
      ClientTokenAuthMethod: {
        TokenAuthMethod: "client_secret_post",
        ClientSecret: "",
      },
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `TokenAuthMethod is "client_secret_post" but ClientSecret was not provided`,
    ]);
  });

  it("should return invalid result when TokenAuthMethod is client_secret_post and identity is enabled", async () => {
    const client = createClient({
      ClientTokenAuthMethod: {
        TokenAuthMethod: "client_secret_post",
        ClientSecret: "test-client-secret", //pragma: allowlist secret
      },
      IdentityVerificationSupported: true,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Cannot use TokenAuthMethod of client_secret_post with identity enabled`,
    ]);
  });

  it("should return invalid result when ClientType is not valid", async () => {
    const client = createClient({
      ClientType: "not-a-client-type" as unknown as ClientType,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Invalid ClientType provided: "not-a-client-type"`,
    ]);
  });

  it("should return invalid result when IdTokenSigningAlgorithm is not valid", async () => {
    const client = createClient({
      IdTokenSigningAlgorithm: "Ed25519" as unknown as IdTokenSigningAlgorithm,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Invalid IdTokenSigningAlgorithm provided: "Ed25519"`,
    ]);
  });
});
