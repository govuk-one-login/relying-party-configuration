import {
  Channel,
  Claim,
  ClientType,
  createClient,
  IdTokenSigningAlgorithm,
  LevelOfConfidence,
  Scope,
  ServiceType,
  SubjectType,
} from "../models/client";
import { allValidators } from "./client-validator";

describe("client validator tests", () => {
  const NON_PROD_ENVS = ["dev", "build", "staging", "integration"];

  beforeEach(() => {
    process.env.ENVIRONMENT = "dev";
  });

  describe("url validation for backChannelLogoutUri", () => {
    it(`should return invalid result when backChannelLogoutUri is not a legal URL`, async () => {
      const client = createClient({
        backChannelLogoutUri: "/////not-a-url!",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field backChannelLogoutUri is not a legal URL`,
      ]);
    });

    it(`should return invalid result when backChannelLogoutUri has an invalid protocol`, async () => {
      const client = createClient({
        backChannelLogoutUri: "http://test.com",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field backChannelLogoutUri does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when backChannelLogoutUri has a local hostname`, async () => {
      const client = createClient({
        backChannelLogoutUri: "https://localhost",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field backChannelLogoutUri is using a local hostname`,
      ]);
    });
  });

  it("should return invalid result when channel is not valid", async () => {
    const client = createClient({
      channel: "not-a-channel" as unknown as Channel,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid channel provided: "not-a-channel"',
    ]);
  });

  it("should return invalid result when claims contains invalid claim", async () => {
    const client = createClient({
      claims: ["not-a-claim"] as unknown as Claim[],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid claim provided: "not-a-claim"',
    ]);
  });

  it("should return invalid result when clientLoCs contains invalid clientLoC", async () => {
    const client = createClient({
      clientLoCs: ["not-an-loc"] as unknown as LevelOfConfidence[],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid clientLoC provided: "not-an-loc"',
    ]);
  });

  it("should return invalid result when clientLoCs contains identity LoC but identity is disabled", async () => {
    const client = createClient({
      clientLoCs: ["P2"],
      identityVerificationSupported: false,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "Identity is disabled but clientLoCs contain identity LoCs",
    ]);
  });

  it("should return invalid result when clientName has an invalid length", async () => {
    const client = createClient({
      clientName: "a".repeat(255),
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "clientName must have between 1 and 255 characters",
    ]);
  });

  it("should return invalid result when clientName has non-ASCII characters", async () => {
    const client = createClient({
      clientName: "My 🆕 Client",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "clientName must ONLY include ASCII characters",
    ]);
  });

  it("should return invalid result when clientName starts with a colon", async () => {
    const client = createClient({
      clientName: ":My Test Client",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons(["clientName must not start with a :"]);
  });

  it("should return invalid result when clientName has only whitespace characters", async () => {
    const client = createClient({
      clientName: "    \t\t\n\n   ",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      "clientName must include at least one non-whitespace character",
    ]);
  });

  it("should return valid result when clientName starts and ends with a whitespace", async () => {
    const client = createClient({
      clientName: " test ",
    });

    const result = await allValidators.validate(client);

    expect(result).toBeValid();
  });

  it("should return invalid result when clientSecret is empty when tokenAuthMethod is client_secret_post", async () => {
    const client = createClient({
      clientTokenAuthMethod: {
        tokenAuthMethod: "client_secret_post",
        clientSecret: "",
      },
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `tokenAuthMethod is "client_secret_post" but clientSecret was not provided`,
    ]);
  });

  it("should return invalid result when tokenAuthMethod is client_secret_post and identity is enabled", async () => {
    const client = createClient({
      clientTokenAuthMethod: {
        tokenAuthMethod: "client_secret_post",
        clientSecret: "test-client-secret", //pragma: allowlist secret
      },
      identityVerificationSupported: true,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Cannot use tokenAuthMethod of client_secret_post with identity enabled`,
    ]);
  });

  it("should return invalid result when clientType is not valid", async () => {
    const client = createClient({
      clientType: "not-a-client-type" as unknown as ClientType,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Invalid clientType provided: "not-a-client-type"`,
    ]);
  });

  it("should return invalid result when idTokenSigningAlgorithm is not valid", async () => {
    const client = createClient({
      idTokenSigningAlgorithm: "Ed25519" as unknown as IdTokenSigningAlgorithm,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Invalid idTokenSigningAlgorithm provided: "Ed25519"`,
    ]);
  });

  describe("url validation for landingPageUrl", () => {
    it(`should return invalid result when landingPageUrl is not a legal URL`, async () => {
      const client = createClient({
        landingPageUrl: "/////not-a-url!",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field landingPageUrl is not a legal URL`,
      ]);
    });

    it(`should return invalid result when landingPageUrl has an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        landingPageUrl: "http://test.com",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field landingPageUrl does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when landingPageUrl has a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        landingPageUrl: "https://localhost",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field landingPageUrl is using a local hostname`,
      ]);
    });

    it(`should return valid result when landingPageUrl has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        landingPageUrl: "http://test.com",
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });

    it(`should return valid result when landingPageUrl has a local hostname in non-prod`, async () => {
      const client = createClient({
        landingPageUrl: "https://localhost",
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  describe("url validation for jwksUrl", () => {
    it(`should return invalid result when jwksUrl is not a legal URL`, async () => {
      const client = createClient({
        clientJwtPublicKeySource: {
          type: "JWKS",
          jwksUrl: "/////not-a-url!",
        },
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([`Field jwksUrl is not a legal URL`]);
    });

    it(`should return invalid result when jwksUrl has an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        clientJwtPublicKeySource: {
          type: "JWKS",
          jwksUrl: "http://test.com",
        },
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field jwksUrl does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when jwksUrl has a local hostname in all environments`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        clientJwtPublicKeySource: {
          type: "JWKS",
          jwksUrl: "https://localhost",
        },
      });

      for (const env of [...NON_PROD_ENVS, "production"]) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeInvalid();
        expect(result).toHaveInvalidReasons([
          `Field jwksUrl is using a local hostname`,
        ]);
      }
    });

    it(`should return valid result when jwksUrl has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        clientJwtPublicKeySource: {
          type: "JWKS",
          jwksUrl: "http://test.com",
        },
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when permitMissingNonce is true and identity is enabled", async () => {
    const client = createClient({
      identityVerificationSupported: true,
      permitMissingNonce: true,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Cannot enable permitMissingNonce if IdentityVerificationSupported is true`,
    ]);
  });

  it("should return invalid result when clientJwkPublicKeySource is STATIC but no JWKS or client secret provided", async () => {
    const client = createClient({
      clientJwtPublicKeySource: {
        type: "STATIC",
        jwks: [],
      },
      clientTokenAuthMethod: {
        tokenAuthMethod: "private_key_jwt",
      },
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Static JWKS cannot be empty when client secret is not provided`,
    ]);
  });

  it("should return invalid result when clientJwkPublicKeySource is STATIC but invalid JWK provided", async () => {
    const client = createClient({
      clientJwtPublicKeySource: {
        type: "STATIC",
        jwks: [{ kid: "not-a-valid-jwk" }],
      },
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Static JWKS contains an invalid JWK`,
    ]);
  });

  describe("url validation for postLogoutRedirectUrls", () => {
    it(`should return invalid result when postLogoutRedirectUrls contains an illegal URL`, async () => {
      const client = createClient({
        postLogoutRedirectUrls: ["/////not-a-url!"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field postLogoutRedirectUrls contains a URL that is not a legal URL`,
      ]);
    });

    it(`should return invalid result when postLogoutRedirectUrls contains a URL with an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        postLogoutRedirectUrls: ["http://test.com"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field postLogoutRedirectUrls contains a URL that does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when postLogoutRedirectUrls contains a URL with a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        postLogoutRedirectUrls: ["https://localhost"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field postLogoutRedirectUrls contains a URL that is using a local hostname`,
      ]);
    });

    it(`should return valid result when postLogoutRedirectUrls contains a URL that has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        postLogoutRedirectUrls: ["http://test.com"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });

    it(`should return valid result when postLogoutRedirectUrls contains a URL that has a local hostname in non-prod`, async () => {
      const client = createClient({
        postLogoutRedirectUrls: ["https://localhost"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when rateLimit is a negative number", async () => {
    const client = createClient({
      rateLimit: -123,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `rateLimit must be a positive whole number`,
    ]);
  });

  it("should return invalid result when rateLimit is not a whole number", async () => {
    const client = createClient({
      rateLimit: 123.456,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `rateLimit must be a positive whole number`,
    ]);
  });

  describe("url validation for redirectUrls", () => {
    it(`should return invalid result when redirectUrls contains an illegal URL`, async () => {
      const client = createClient({
        redirectUrls: ["/////not-a-url!"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field redirectUrls contains a URL that is not a legal URL`,
      ]);
    });

    it(`should return invalid result when redirectUrls contains a URL with an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        redirectUrls: ["http://test.com"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field redirectUrls contains a URL that does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when redirectUrls contains a URL with a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        redirectUrls: ["https://localhost"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field redirectUrls contains a URL that is using a local hostname`,
      ]);
    });

    it("should return invalid result when redirectUrls is empty", async () => {
      const client = createClient({
        redirectUrls: [],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field redirectUrls cannot be empty`,
      ]);
    });

    it("should return invalid result when redirectUrls contains a URL with an invalid schema", async () => {
      const client = createClient({
        redirectUrls: ["javascript://stuff"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `redirectUrls contains a URL with an invalid schema`,
      ]);
    });

    it("should return invalid result when redirectUrls contains a URL with an invalid query parameter", async () => {
      const client = createClient({
        redirectUrls: ["https://example.com?code=123"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `redirectUrls contains a URL with an invalid query parameter name`,
      ]);
    });

    it(`should return valid result when redirectUrls contains a URL that has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        redirectUrls: ["http://test.com"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });

    it(`should return valid result when redirectUrls contains a URL that has a local hostname in non-prod`, async () => {
      const client = createClient({
        redirectUrls: ["https://localhost"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when scopes contain invalid value", async () => {
    const client = createClient({
      scopes: ["openid", "not-a-scope"] as unknown as Scope[],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Invalid Scope provided: "not-a-scope"`,
    ]);
  });

  it('should return invalid result when scopes does not contain "openid"', async () => {
    const client = createClient({
      scopes: [],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([`scopes must contain "openid"`]);
  });

  describe("url validation for sectorIdentifierUri", () => {
    it(`should return invalid result when sectorIdentifierUri is not a legal URL`, async () => {
      const client = createClient({
        sectorIdentifierUri: "/////not-a-url!",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field sectorIdentifierUri is not a legal URL`,
      ]);
    });

    it(`should return invalid result when sectorIdentifierUri has a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        sectorIdentifierUri: "https://localhost",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field sectorIdentifierUri is using a local hostname`,
      ]);
    });

    it(`should return valid result when sectorIdentifierUri has a local hostname in non-prod`, async () => {
      const client = createClient({
        sectorIdentifierUri: "https://localhost",
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when serviceType is not valid", async () => {
    const client = createClient({
      serviceType: "not-a-service-type" as unknown as ServiceType,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid serviceType provided: "not-a-service-type"',
    ]);
  });

  it("should return invalid result when subjectType is not valid", async () => {
    const client = createClient({
      subjectType: "not-a-subject-type" as unknown as SubjectType,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid subjectType provided: "not-a-subject-type"',
    ]);
  });
});
