import { JWK } from "jose";
import crypto from "crypto";

export interface JwksPublicKeySource {
  Type: "JWKS";
  JwksUrl: string;
}
export interface StaticPublicKeySource {
  Type: "STATIC";
  Jwks: JWK[];
}
export type ClientJwtPublicKeySource =
  | JwksPublicKeySource
  | StaticPublicKeySource;
export interface PrivateKeyJwtAuth {
  TokenAuthMethod: "private_key_jwt";
}
export interface ClientSecretPostAuth {
  TokenAuthMethod: "client_secret_post";
  ClientSecret: string;
}
export type ClientTokenAuthMethod = PrivateKeyJwtAuth | ClientSecretPostAuth;
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
export const VALID_CLIENT_TYPES = Object.freeze(["web", "app"] as const);
export type ClientType = (typeof VALID_CLIENT_TYPES)[number];
export const VALID_TOKEN_SIGNING_ALGS = Object.freeze([
  "ES256",
  "RS256",
  "RSA256", // TODO Needed to support migration only!
] as const);
export type IdTokenSigningAlgorithm = (typeof VALID_TOKEN_SIGNING_ALGS)[number];
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
  LandingPageUrl?: string;
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
    JwksUrl: "https://example.com",
  },
  ClientTokenAuthMethod: {
    TokenAuthMethod: "private_key_jwt",
  },
  Scopes: ["openid"],
  RedirectUrls: ["https://example.com"],
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
