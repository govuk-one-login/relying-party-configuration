import { JWK } from "jose";
import crypto from "crypto";

export type ClientJwtPublicKeySource =
  | {
      Type: "JWKS";
      JwksUrl: string;
    }
  | {
      Type: "STATIC";
      Jwks: JWK[];
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
export const VALID_CLAIMS = Object.freeze([
  "https://vocab.account.gov.uk/v1/passport",
  "https://vocab.account.gov.uk/v1/drivingPermit",
  "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  "https://vocab.account.gov.uk/v1/address",
  "https://vocab.account.gov.uk/v1/returnCode",
] as const);
export type Claim = (typeof VALID_CLAIMS)[number];
export type ServiceType = "MANDATORY" | "OPTIONAL";
export type SubjectType = "pairwise" | "public";
export type ClientType = "web" | "app";
export type IdTokenSigningAlgorithm = "ES256" | "RS256";
export const VALID_LOCS = Object.freeze(["P0", "P1", "P2", "P3"] as const);
export type LevelOfConfidence = (typeof VALID_LOCS)[number];
export const VALID_CHANNELS = Object.freeze([
  "web",
  "generic_app",
  "strategic_app",
] as const);
export type Channel = (typeof VALID_CHANNELS)[number];
export interface PaginatedClientSummary {
  pageSize: number;
  pageNumber: number;
  totalClients: number;
  totalPages: number;
  clients: ClientSummary[];
}
export interface ClientSummary {
  ClientID: string;
  ClientName: string;
}
export interface Client extends ClientInput {
  ClientID: string;
  Created: number;
  LastModified: number;
}
export interface ClientInput {
  ClientName: string;
  ClientJwtPublicKeySource: ClientJwtPublicKeySource;
  ClientTokenAuthMethod: ClientTokenAuthMethod;
  Scopes: Scope[];
  RedirectUrls: string[];
  PostLogoutRedirectUrls: string[];
  BackChannelLogoutUri?: string;
  ServiceType: ServiceType;
  SectorIdentifierUri: string;
  SubjectType: SubjectType;
  IsActive: boolean;
  IsDeprecated: boolean;
  CookieConsentShared: boolean;
  TestClient: boolean;
  JarValidationRequired: boolean;
  Claims: Claim[];
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
}
export const CLIENT_DEFAULTS: ClientInput = {
  ClientName: "test-client",
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
  ServiceType: "MANDATORY",
  SectorIdentifierUri: "",
  SubjectType: "pairwise",
  IsActive: true,
  IsDeprecated: false,
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
};
export function createClient(overrides?: Partial<Client>): Client {
  return {
    ...CLIENT_DEFAULTS,
    ...overrides,
    ClientID:
      overrides?.ClientID ?? crypto.randomBytes(20).toString("base64url"),
    Created: overrides?.Created ?? 123456,
    LastModified: overrides?.LastModified ?? 123456,
  };
}
