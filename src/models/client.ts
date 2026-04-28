export type ClientJwtPublicKeySource =
  | {
      Type: "JWKS";
      JwksUrl: string;
    }
  | {
      Type: "STATIC";
      PublicKey: string;
    };
export type ClientTokenAuthMethod =
  | {
      TokenAuthMethod: "private_key_jwt";
    }
  | {
      TokenAuthMethod: "client_secret_post";
      ClientSecret: string;
    };
export type Scope =
  | "openid"
  | "phone"
  | "email"
  | "wallet_subject_id"
  | "am"
  | "offline_access";
export type Claim =
  | "https://vocab.account.gov.uk/v1/passport"
  | "https://vocab.account.gov.uk/v1/drivingPermit"
  | "https://vocab.account.gov.uk/v1/coreIdentityJWT"
  | "https://vocab.account.gov.uk/v1/address"
  | "https://vocab.account.gov.uk/v1/returnCode";
export type ServiceType = "MANDATORY" | "OPTIONAL";
export type SubjectType = "pairwise" | "public";
export type ClientType = "web" | "app";
export type IdTokenSigningAlgorithm = "ES256" | "RS256";
export type LevelOfConfidence = "P0" | "P1" | "P2" | "P3";
export type Channel = "web" | "generic_app" | "strategic_app";
export interface ClientSummary {
  ClientID: string;
  ClientName: string;
}
export interface Client extends ClientInput {
  ClientID: string;
}
export interface ClientInput {
  ClientName: string;
  ClientJwtPublicKeySource: ClientJwtPublicKeySource;
  ClientTokenAuthMethod: ClientTokenAuthMethod;
  Scopes: Scope[];
  RedirectUrls: string[];
  PostLogoutRedirectUrls: string[];
  BackChannelLogoutUri: string;
  ServiceType: ServiceType;
  SectorIdentifierUri: string;
  SubjectType: SubjectType;
  IsActive: boolean;
  CookieConsentShared: boolean;
  TestClient: boolean;
  JarValidationRequired: boolean;
  Claims: string[];
  ClientType: ClientType;
  IdentityVerificationSupported: boolean;
  OneLoginService: boolean;
  IdTokenSigningAlgorithm: IdTokenSigningAlgorithm;
  SmokeTest: boolean;
  LandingPageUrl: string;
  ClientLoCs: LevelOfConfidence[];
  PermitMissingNonce: boolean;
  Channel: Channel;
  MaxAgeEnabled: boolean;
  PkceEnforced: boolean;
  RateLimit?: number;
  OrganisationId: string;
  ServiceIntegrationId: string;
  Created: number;
  LastModified: number;
}
export const CLIENT_DEFAULTS: ClientInput = {
  ClientName: "",
  ClientJwtPublicKeySource: {
    Type: "JWKS",
    JwksUrl: "http://example.com",
  },
  ClientTokenAuthMethod: {
    TokenAuthMethod: "private_key_jwt",
  },
  Scopes: ["openid"],
  RedirectUrls: [],
  PostLogoutRedirectUrls: [],
  BackChannelLogoutUri: "",
  ServiceType: "MANDATORY",
  SectorIdentifierUri: "",
  SubjectType: "pairwise",
  IsActive: true,
  CookieConsentShared: false,
  TestClient: false,
  JarValidationRequired: false,
  Claims: [],
  ClientType: "web",
  IdentityVerificationSupported: false,
  OneLoginService: false,
  IdTokenSigningAlgorithm: "ES256",
  SmokeTest: false,
  LandingPageUrl: "",
  ClientLoCs: ["P0"],
  PermitMissingNonce: false,
  Channel: "web",
  MaxAgeEnabled: false,
  PkceEnforced: false,
  OrganisationId: "test-org",
  ServiceIntegrationId: "test-service-integration",
  Created: 123456,
  LastModified: 123456,
};
export function createClient(
  clientId: string,
  overrides?: Partial<ClientInput>,
): Client {
  return { ...CLIENT_DEFAULTS, ...overrides, ClientID: clientId };
}
