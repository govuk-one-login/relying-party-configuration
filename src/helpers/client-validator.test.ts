import {
  Channel,
  Claim,
  ClientType,
  createClient,
  IdTokenSigningAlgorithm,
  LevelOfConfidence,
  Scope,
  ServiceType,
} from "../models/client";
import { allValidators } from "./client-validator";

describe("Client validator tests", () => {
  const NON_PROD_ENVS = ["dev", "build", "staging", "integration"];
  beforeEach(() => {
    process.env.ENVIRONMENT = "dev";
  });
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

  describe("URL validation for LandingPageUrl", () => {
    it(`should return invalid result when LandingPageUrl is not a legal URL`, async () => {
      const client = createClient({
        LandingPageUrl: "/////not-a-url!",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field LandingPageUrl is not a legal URL`,
      ]);
    });

    it(`should return invalid result when LandingPageUrl has an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        LandingPageUrl: "http://test.com",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field LandingPageUrl does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when LandingPageUrl has a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        LandingPageUrl: "https://localhost",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field LandingPageUrl is using a local hostname`,
      ]);
    });

    it(`should return valid result when LandingPageUrl has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        LandingPageUrl: "http://test.com",
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });

    it(`should return valid result when LandingPageUrl has a local hostname in non-prod`, async () => {
      const client = createClient({
        LandingPageUrl: "https://localhost",
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });
  describe("URL validation for JwksUrl", () => {
    it(`should return invalid result when JwksUrl is not a legal URL`, async () => {
      const client = createClient({
        ClientJwtPublicKeySource: {
          Type: "JWKS",
          JwksUrl: "/////not-a-url!",
        },
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([`Field JwksUrl is not a legal URL`]);
    });

    it(`should return invalid result when JwksUrl has an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        ClientJwtPublicKeySource: {
          Type: "JWKS",
          JwksUrl: "http://test.com",
        },
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field JwksUrl does not have a valid URL protocol`,
      ]);
    });

    it(`should return valid result when JwksUrl has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        ClientJwtPublicKeySource: {
          Type: "JWKS",
          JwksUrl: "http://test.com",
        },
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when PermitMissingNonce is true and identity is enabled", async () => {
    const client = createClient({
      IdentityVerificationSupported: true,
      PermitMissingNonce: true,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Cannot enable PermitMissingNonce if IdentityVerificationSupported is true`,
    ]);
  });

  it("should return invalid result when StaticJwkPublicKeySource but no JWKS or client secret provided", async () => {
    const client = createClient({
      ClientJwtPublicKeySource: {
        Type: "STATIC",
        Jwks: [],
      },
      ClientTokenAuthMethod: {
        TokenAuthMethod: "private_key_jwt",
      },
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Static JWKS cannot be empty when client secret is not provided`,
    ]);
  });

  it("should return invalid result when StaticJwkPublicKeySource but no JWKS provided", async () => {
    const client = createClient({
      ClientJwtPublicKeySource: {
        Type: "STATIC",
        Jwks: [{ kid: "not-a-valid-jwk" }],
      },
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Static JWKS contains an invalid JWK`,
    ]);
  });

  describe("URL validation for PostLogoutRedirectUrls", () => {
    it(`should return invalid result when PostLogoutRedirectUrls contains an illegal URL`, async () => {
      const client = createClient({
        PostLogoutRedirectUrls: ["/////not-a-url!"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field PostLogoutRedirectUrls contains a URL that is not a legal URL`,
      ]);
    });

    it(`should return invalid result when PostLogoutRedirectUrls contains a URL with an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        PostLogoutRedirectUrls: ["http://test.com"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field PostLogoutRedirectUrls contains a URL that does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when PostLogoutRedirectUrls contains a URL with a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        PostLogoutRedirectUrls: ["https://localhost"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field PostLogoutRedirectUrls contains a URL that is using a local hostname`,
      ]);
    });

    it(`should return valid result when PostLogoutRedirectUrls contains a URL that has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        PostLogoutRedirectUrls: ["http://test.com"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });

    it(`should return valid result when PostLogoutRedirectUrls contains a URL that has a local hostname in non-prod`, async () => {
      const client = createClient({
        PostLogoutRedirectUrls: ["https://localhost"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when RateLimit is a negative number", async () => {
    const client = createClient({
      RateLimit: -123,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `RateLimit must be a positive whole number`,
    ]);
  });

  it("should return invalid result when RateLimit is not a whole number", async () => {
    const client = createClient({
      RateLimit: 123.456,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `RateLimit must be a positive whole number`,
    ]);
  });

  describe("URL validation for RedirectUrls", () => {
    it(`should return invalid result when RedirectUrls contains an illegal URL`, async () => {
      const client = createClient({
        RedirectUrls: ["/////not-a-url!"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field RedirectUrls contains a URL that is not a legal URL`,
      ]);
    });

    it(`should return invalid result when RedirectUrls contains a URL with an invalid protocol in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        RedirectUrls: ["http://test.com"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field RedirectUrls contains a URL that does not have a valid URL protocol`,
      ]);
    });

    it(`should return invalid result when RedirectUrls contains a URL with a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        RedirectUrls: ["https://localhost"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field RedirectUrls contains a URL that is using a local hostname`,
      ]);
    });

    it("should return invalid result when RedirectUrls is empty", async () => {
      const client = createClient({
        RedirectUrls: [],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field RedirectUrls cannot be empty`,
      ]);
    });

    it("should return invalid result when RedirectUrls contains a URL with an invalid schema", async () => {
      const client = createClient({
        RedirectUrls: ["javascript://stuff"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `RedirectUrls contains a URL with an invalid schema`,
      ]);
    });

    it("should return invalid result when RedirectUrls contains a URL with an invalid query parameter", async () => {
      const client = createClient({
        RedirectUrls: ["https://example.com?code=123"],
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `RedirectUrls contains a URL with an invalid query parameter name`,
      ]);
    });

    it(`should return valid result when RedirectUrls contains a URL that has an invalid protocol in non-prod`, async () => {
      const client = createClient({
        RedirectUrls: ["http://test.com"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });

    it(`should return valid result when RedirectUrls contains a URL that has a local hostname in non-prod`, async () => {
      const client = createClient({
        RedirectUrls: ["https://localhost"],
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when Scopes contain invalid value", async () => {
    const client = createClient({
      Scopes: ["openid", "not-a-scope"] as unknown as Scope[],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      `Invalid Scope provided: "not-a-scope"`,
    ]);
  });

  it('should return invalid result when Scopes does not contain "openid"', async () => {
    const client = createClient({
      Scopes: [],
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([`Scopes must contain "openid"`]);
  });

  describe("URL validation for SectorIdentifierUri", () => {
    it(`should return invalid result when SectorIdentifierUri is not a legal URL`, async () => {
      const client = createClient({
        SectorIdentifierUri: "/////not-a-url!",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field SectorIdentifierUri is not a legal URL`,
      ]);
    });

    it(`should return invalid result when SectorIdentifierUri has a local hostname in production`, async () => {
      process.env.ENVIRONMENT = "production";
      const client = createClient({
        SectorIdentifierUri: "https://localhost",
      });

      const result = await allValidators.validate(client);

      expect(result).toBeInvalid();
      expect(result).toHaveInvalidReasons([
        `Field SectorIdentifierUri is using a local hostname`,
      ]);
    });

    it(`should return valid result when SectorIdentifierUri has a local hostname in non-prod`, async () => {
      const client = createClient({
        SectorIdentifierUri: "https://localhost",
      });

      for (const env of NON_PROD_ENVS) {
        process.env.ENVIRONMENT = env;
        const result = await allValidators.validate(client);

        expect(result).toBeValid();
      }
    });
  });

  it("should return invalid result when ServiceType is not valid", async () => {
    const client = createClient({
      ServiceType: "not-a-service-type" as unknown as ServiceType,
    });

    const result = await allValidators.validate(client);

    expect(result).toBeInvalid();
    expect(result).toHaveInvalidReasons([
      'Invalid ServiceType provided: "not-a-service-type"',
    ]);
  });
});
