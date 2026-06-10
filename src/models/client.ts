import { JWK } from "jose";
import crypto from "crypto";

export interface JwksPublicKeySource {
  type: "JWKS";
  jwksUrl: string;
}
export interface StaticPublicKeySource {
  type: "STATIC";
  jwks: JWK[];
}
export type ClientJwtPublicKeySource =
  | JwksPublicKeySource
  | StaticPublicKeySource;
export interface PrivateKeyJwtAuth {
  tokenAuthMethod: "private_key_jwt";
}
export interface ClientSecretPostAuth {
  tokenAuthMethod: "client_secret_post";
  clientSecret: string;
}
export type ClientTokenAuthMethod = PrivateKeyJwtAuth | ClientSecretPostAuth;
export const VALID_SCOPES = Object.freeze([
  "openid",
  "phone",
  "email",
  "wallet_subject_id",
  "am",
  "offline_access",
] as const);
export type Scope = (typeof VALID_SCOPES)[number];
export const VALID_CLAIMS = Object.freeze([
  "https://vocab.account.gov.uk/v1/passport",
  "https://vocab.account.gov.uk/v1/drivingPermit",
  "https://vocab.account.gov.uk/v1/coreIdentityJWT",
  "https://vocab.account.gov.uk/v1/address",
  "https://vocab.account.gov.uk/v1/returnCode",
] as const);
export type Claim = (typeof VALID_CLAIMS)[number];
export const VALID_SERVICE_TYPES = Object.freeze([
  "MANDATORY",
  "OPTIONAL",
] as const);
export type ServiceType = (typeof VALID_SERVICE_TYPES)[number];
export const VALID_SUBJECT_TYPES = Object.freeze([
  "pairwise",
  "public",
] as const);
export type SubjectType = (typeof VALID_SUBJECT_TYPES)[number];
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
  clientId: string;
  clientName: string;
}
export interface Client extends ClientInput {
  clientId: string;
  created: number;
  lastModified: number;
}
export interface ClientInput {
  clientName: string;
  clientJwtPublicKeySource: ClientJwtPublicKeySource;
  clientTokenAuthMethod: ClientTokenAuthMethod;
  scopes: Scope[];
  redirectUrls: string[];
  postLogoutRedirectUrls: string[];
  backChannelLogoutUri?: string;
  serviceType: ServiceType;
  sectorIdentifierUri: string;
  subjectType: SubjectType;
  isActive: boolean;
  isDeprecated: boolean;
  cookieConsentShared: boolean;
  testClient: boolean;
  jarValidationRequired: boolean;
  claims: Claim[];
  clientType: ClientType;
  identityVerificationSupported: boolean;
  oneLoginService: boolean;
  idTokenSigningAlgorithm: IdTokenSigningAlgorithm;
  smokeTest: boolean;
  landingPageUrl?: string;
  clientLoCs: LevelOfConfidence[];
  permitMissingNonce: boolean;
  channel: Channel;
  maxAgeEnabled: boolean;
  pkceEnforced: boolean;
  rateLimit?: number;
  organisationId: string;
  serviceIntegrationId: string;
}
export const CLIENT_DEFAULTS: ClientInput = {
  clientName: "test-client",
  clientJwtPublicKeySource: {
    type: "JWKS",
    jwksUrl: "https://example.com",
  },
  clientTokenAuthMethod: {
    tokenAuthMethod: "private_key_jwt",
  },
  scopes: ["openid"],
  redirectUrls: ["https://example.com"],
  postLogoutRedirectUrls: [],
  serviceType: "MANDATORY",
  sectorIdentifierUri: "https://example.com",
  subjectType: "pairwise",
  isActive: true,
  isDeprecated: false,
  cookieConsentShared: false,
  testClient: false,
  jarValidationRequired: false,
  claims: [],
  clientType: "web",
  identityVerificationSupported: false,
  oneLoginService: false,
  idTokenSigningAlgorithm: "ES256",
  smokeTest: false,
  landingPageUrl: "",
  clientLoCs: ["P0"],
  permitMissingNonce: false,
  channel: "web",
  maxAgeEnabled: false,
  pkceEnforced: false,
  organisationId: "test-org",
  serviceIntegrationId: "test-service-integration",
};
export function createClient(overrides?: Partial<Client>): Client {
  return {
    ...CLIENT_DEFAULTS,
    ...overrides,
    clientId:
      overrides?.clientId ?? crypto.randomBytes(20).toString("base64url"),
    created: overrides?.created ?? 123456,
    lastModified: overrides?.lastModified ?? 123456,
  };
}
