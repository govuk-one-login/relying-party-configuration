import { importJWK, JWK } from "jose";
import {
  Client,
  ClientSecretPostAuth,
  ClientTokenAuthMethod,
  JwksPublicKeySource,
  StaticPublicKeySource,
  VALID_CHANNELS,
  VALID_CLAIMS,
  VALID_CLIENT_TYPES,
  VALID_LOCS,
  VALID_SCOPES,
  VALID_SERVICE_TYPES,
  VALID_SUBJECT_TYPES,
  VALID_TOKEN_SIGNING_ALGS,
} from "../models/client";
import { invalid, rule, valid, Validator, optional, when } from "./validator";

const IDENTITY_LOCS = ["P1", "P2", "P3"];

const PROHIBITED_REDIRECT_URI_SCHEMES: string[] = [
  "data",
  "javascript",
  "vbscript",
];

const PROHIBITED_REDIRECT_URI_QUERY_PARAMETER_NAMES: string[] = [
  "code",
  "state",
  "response",
];

const isProd = (): boolean => process.env.ENVIRONMENT === "production";

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
  } catch {
    return false;
  }
  return true;
};

const protocolNotHttp = (url: string): boolean => {
  return !url.startsWith("http:");
};

const isNotLocalhost = (url: string): boolean => {
  return !(url.includes("localhost") || url.includes("127.0.0.1"));
};

const validUrlValidator = (fieldName: string): Validator<string> =>
  rule(isValidUrl, `Field ${fieldName} is not a legal URL`);
const notHttpValidator = (fieldName: string): Validator<string> =>
  rule(
    protocolNotHttp,
    `Field ${fieldName} does not have a valid URL protocol`,
  );
const notLocalhostValidator = (fieldName: string): Validator<string> =>
  rule(isNotLocalhost, `Field ${fieldName} is using a local hostname`);

const listValidator = <T>(validator: Validator<T>): Validator<T[]> => {
  return new Validator(async (values: T[]) => {
    const results = await Promise.all(
      values.map((value) => validator.validate(value)),
    );
    const errors: string[] = results
      .filter((result) => !result.isValid)
      .flatMap((result) => result.reasons);
    if (errors.length > 0) {
      return invalid(errors);
    }
    return valid();
  });
};

const fieldValidator = (
  validValues: readonly string[],
  fieldName: string,
): Validator<string> =>
  rule(
    (value: string) => validValues.includes(value),
    (value: string) => `Invalid ${fieldName} provided: "${value}"`,
  );

const listFieldValidator = (
  validValues: readonly string[],
  fieldName: string,
): Validator<string[]> => listValidator(fieldValidator(validValues, fieldName));

const notEmptyValidator = <T>(fieldName: string): Validator<T[]> =>
  rule((input: T[]) => {
    return input.length > 0;
  }, `Field ${fieldName} cannot be empty`);

const backChannelLogoutUriValidator = optional(
  validUrlValidator("backChannelLogoutUri")
    .and(notHttpValidator("backChannelLogoutUri"))
    .and(notLocalhostValidator("backChannelLogoutUri")),
).adaptedFrom((client: Client) => client.backChannelLogoutUri);

const channelValidator = fieldValidator(VALID_CHANNELS, "channel").adaptedFrom(
  (client: Client) => client.channel,
);

const claimsValidator = listFieldValidator(VALID_CLAIMS, "claim").adaptedFrom(
  (client: Client) => client.claims,
);

const clientLoCsValidator = listFieldValidator(VALID_LOCS, "clientLoC")
  .adaptedFrom((client: Client) => client.clientLoCs)
  .and(
    when(
      (client: Client) => !client.identityVerificationSupported,
      rule(
        (client: Client) =>
          !client.clientLoCs.some((clientLoC) =>
            IDENTITY_LOCS.includes(clientLoC),
          ),
        "Identity is disabled but clientLoCs contain identity LoCs",
      ),
    ),
  );

const clientNameValidator = rule(
  (clientName: string) => clientName.length > 0 && clientName.length < 255,
  "clientName must have between 1 and 255 characters",
)
  .and(
    rule(
      // eslint-disable-next-line no-control-regex
      (clientName: string) => /^[\x00-\x7F]{1,255}$/.test(clientName),
      "clientName must ONLY include ASCII characters",
    ),
  )
  .and(
    rule(
      (clientName: string) => /(?!(\s+)).$/.test(clientName),
      "clientName must include at least one non-whitespace character",
    ),
  )
  .and(
    rule(
      (clientName: string) => !clientName.startsWith(":"),
      "clientName must not start with a :",
    ),
  )
  .adaptedFrom((client: Client) => client.clientName);

const clientSecretValidator = when(
  (tokenAuthMethod: ClientTokenAuthMethod) =>
    tokenAuthMethod.tokenAuthMethod === "client_secret_post",
  rule(
    (tokenAuthMethod: ClientTokenAuthMethod) =>
      !!(tokenAuthMethod as ClientSecretPostAuth).clientSecret,
    `tokenAuthMethod is "client_secret_post" but clientSecret was not provided`,
  ),
)
  .adaptedFrom((client: Client) => client.clientTokenAuthMethod)
  .and(
    when(
      (client: Client) => client.identityVerificationSupported,
      rule(
        (client: Client) =>
          client.clientTokenAuthMethod.tokenAuthMethod === "private_key_jwt",
        "Cannot use tokenAuthMethod of client_secret_post with identity enabled",
      ),
    ),
  );

const clientTypeValidator = fieldValidator(
  VALID_CLIENT_TYPES,
  "clientType",
).adaptedFrom((client: Client) => client.clientType);

const idTokenSigningAlgorithmValidator = fieldValidator(
  VALID_TOKEN_SIGNING_ALGS,
  "idTokenSigningAlgorithm",
).adaptedFrom((client: Client) => client.idTokenSigningAlgorithm);

const landingPageUrlValidator = optional(
  validUrlValidator("landingPageUrl").and(
    when(
      isProd,
      notHttpValidator("landingPageUrl").and(
        notLocalhostValidator("landingPageUrl"),
      ),
    ),
  ),
).adaptedFrom((client: Client) => client.landingPageUrl);

const jwksUrlValidator = when(
  (client: Client) => client.clientJwtPublicKeySource.type === "JWKS",
  validUrlValidator("jwksUrl")
    .and(when(isProd, notHttpValidator("jwksUrl")))
    .and(notLocalhostValidator("jwksUrl"))
    .adaptedFrom(
      (client: Client) =>
        (client.clientJwtPublicKeySource as JwksPublicKeySource).jwksUrl,
    ),
);

const staticJwksValidator = when(
  (client: Client) => client.clientJwtPublicKeySource.type === "STATIC",
  rule((client: Client) => {
    const jwks = (client.clientJwtPublicKeySource as StaticPublicKeySource)
      .jwks;
    return (
      jwks.length > 0 ||
      client.clientTokenAuthMethod.tokenAuthMethod === "client_secret_post"
    );
  }, "Static JWKS cannot be empty when client secret is not provided").and(
    when(
      (jwks: JWK[]) => jwks.length > 0,
      rule(async (jwks: JWK[]) => {
        for (const jwk of jwks) {
          try {
            await importJWK(jwk);
          } catch {
            return false;
          }
        }
        return true;
      }, "Static JWKS contains an invalid JWK"),
    ).adaptedFrom(
      (client: Client) =>
        (client.clientJwtPublicKeySource as StaticPublicKeySource).jwks,
    ),
  ),
);

const permitMissingNonceValidator = when(
  (client: Client) => client.identityVerificationSupported,
  rule(
    (client: Client) => !client.permitMissingNonce,
    "Cannot enable permitMissingNonce if IdentityVerificationSupported is true",
  ),
);

const postLogoutRedirectUrlsValidator = listValidator(
  rule(
    isValidUrl,
    `Field postLogoutRedirectUrls contains a URL that is not a legal URL`,
  ).and(
    when(
      isProd,
      rule(
        protocolNotHttp,
        `Field postLogoutRedirectUrls contains a URL that does not have a valid URL protocol`,
      ).and(
        rule(
          isNotLocalhost,
          `Field postLogoutRedirectUrls contains a URL that is using a local hostname`,
        ),
      ),
    ),
  ),
).adaptedFrom((client: Client) => client.postLogoutRedirectUrls);

const rateLimitValidator = rule(
  (rateLimit?: number) =>
    !rateLimit || (rateLimit > 0 && Math.floor(rateLimit) === rateLimit),
  "rateLimit must be a positive whole number",
).adaptedFrom((client: Client) => client.rateLimit);

const redirectUrlsValidator = notEmptyValidator<string>("redirectUrls")
  .and(
    listValidator(
      rule(
        isValidUrl,
        `Field redirectUrls contains a URL that is not a legal URL`,
      )
        .and(
          when(
            isProd,
            rule(
              protocolNotHttp,
              `Field redirectUrls contains a URL that does not have a valid URL protocol`,
            ).and(
              rule(
                isNotLocalhost,
                `Field redirectUrls contains a URL that is using a local hostname`,
              ),
            ),
          ),
        )
        .and(
          when(
            isValidUrl,
            rule((urlString: string) => {
              const url = new URL(urlString);

              let valid = true;
              url.searchParams.forEach((_value, key) => {
                if (
                  PROHIBITED_REDIRECT_URI_QUERY_PARAMETER_NAMES.includes(key)
                ) {
                  valid = false;
                }
              });
              return valid;
            }, "redirectUrls contains a URL with an invalid query parameter name"),
          ),
        )
        .and(
          when(
            isValidUrl,
            rule((urlString: string) => {
              const url = new URL(urlString);

              const urlScheme = url.protocol.replace(":", "");

              return !PROHIBITED_REDIRECT_URI_SCHEMES.includes(urlScheme);
            }, "redirectUrls contains a URL with an invalid schema"),
          ),
        ),
    ),
  )
  .adaptedFrom((client: Client) => client.redirectUrls);

const scopesValidator = listFieldValidator(VALID_SCOPES, "Scope")
  .and(
    rule(
      (scopes: string[]) => scopes.includes("openid"),
      'scopes must contain "openid"',
    ),
  )
  .adaptedFrom((client: Client) => client.scopes);

const sectorIdentifierUriValidator = validUrlValidator("sectorIdentifierUri")
  .and(when(isProd, notLocalhostValidator("sectorIdentifierUri")))
  .adaptedFrom((client: Client) => client.sectorIdentifierUri);

const serviceTypeValidator = fieldValidator(
  VALID_SERVICE_TYPES,
  "serviceType",
).adaptedFrom((client: Client) => client.serviceType);

const subjectTypeValidator = fieldValidator(
  VALID_SUBJECT_TYPES,
  "subjectType",
).adaptedFrom((client: Client) => client.subjectType);

export const allValidators = backChannelLogoutUriValidator
  .and(channelValidator)
  .and(claimsValidator)
  .and(clientLoCsValidator)
  .and(clientNameValidator)
  .and(clientSecretValidator)
  .and(clientTypeValidator)
  .and(idTokenSigningAlgorithmValidator)
  .and(landingPageUrlValidator)
  .and(jwksUrlValidator)
  .and(staticJwksValidator)
  .and(permitMissingNonceValidator)
  .and(postLogoutRedirectUrlsValidator)
  .and(rateLimitValidator)
  .and(redirectUrlsValidator)
  .and(scopesValidator)
  .and(sectorIdentifierUriValidator)
  .and(serviceTypeValidator)
  .and(subjectTypeValidator);
