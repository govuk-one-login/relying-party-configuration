import {
  Client,
  ClientSecretPostAuth,
  ClientTokenAuthMethod,
  VALID_CHANNELS,
  VALID_CLAIMS,
  VALID_CLIENT_TYPES,
  VALID_LOCS,
} from "../models/client";
import { invalid, rule, valid, Validator, optional, when } from "./validator";

const IDENTITY_LOCS = ["P1", "P2", "P3"];
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

const validUrlValidator = (fieldName: string) =>
  rule(isValidUrl, `Field ${fieldName} is not a legal URL`);
const notHttpValidator = (fieldName: string) =>
  rule(
    protocolNotHttp,
    `Field ${fieldName} does not have a valid URL protocol`,
  );
const notLocalhostValidator = (fieldName: string) =>
  rule(isNotLocalhost, `Field ${fieldName} is using a local hostname`);

const listValidator = <T>(validator: Validator<T>) => {
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

const fieldValidator = (validValues: readonly string[], fieldName: string) =>
  rule(
    (value: string) => validValues.includes(value),
    (value: string) => `Invalid ${fieldName} provided: "${value}"`,
  );

const listFieldValidator = (
  validValues: readonly string[],
  fieldName: string,
) => listValidator(fieldValidator(validValues, fieldName));

const backChannelLogoutUriValidator = optional(
  validUrlValidator("BackChannelLogoutUri")
    .and(notHttpValidator("BackChannelLogoutUri"))
    .and(notLocalhostValidator("BackChannelLogoutUri")),
).adaptedFrom((client: Client) => client.BackChannelLogoutUri);

const channelValidator = fieldValidator(VALID_CHANNELS, "Channel").adaptedFrom(
  (client: Client) => client.Channel,
);

const claimsValidator = listFieldValidator(VALID_CLAIMS, "Claim").adaptedFrom(
  (client: Client) => client.Claims,
);

const clientLoCsValidator = listFieldValidator(VALID_LOCS, "ClientLoC")
  .adaptedFrom((client: Client) => client.ClientLoCs)
  .and(
    when(
      (client: Client) => !client.IdentityVerificationSupported,
      rule(
        (client: Client) =>
          !client.ClientLoCs.some((clientLoC) =>
            IDENTITY_LOCS.includes(clientLoC),
          ),
        "Identity is disabled but ClientLoCs contain identity LoCs",
      ),
    ),
  );

const clientNameValidator = rule(
  (clientName: string) => clientName.length > 0 && clientName.length < 255,
  "ClientName must have between 1 and 255 characters",
)
  .and(
    rule(
      (clientName: string) => /^[\x00-\x7F]{1,255}$/.test(clientName),
      "ClientName must ONLY include ASCII characters",
    ),
  )
  .and(
    rule(
      (clientName: string) => /(?!(\s+)).$/.test(clientName),
      "ClientName must include at least one non-whitespace character",
    ),
  )
  .and(
    rule(
      (clientName: string) => !clientName.startsWith(":"),
      "ClientName must not start with a :",
    ),
  )
  .adaptedFrom((client: Client) => client.ClientName);

const clientSecretValidator = when(
  (tokenAuthMethod: ClientTokenAuthMethod) =>
    tokenAuthMethod.TokenAuthMethod === "client_secret_post",
  rule(
    (tokenAuthMethod: ClientTokenAuthMethod) =>
      !!(tokenAuthMethod as ClientSecretPostAuth).ClientSecret,
    `TokenAuthMethod is "client_secret_post" but ClientSecret was not provided`,
  ),
)
  .adaptedFrom((client: Client) => client.ClientTokenAuthMethod)
  .and(
    when(
      (client: Client) => client.IdentityVerificationSupported,
      rule(
        (client: Client) =>
          client.ClientTokenAuthMethod.TokenAuthMethod === "private_key_jwt",
        "Cannot use TokenAuthMethod of client_secret_post with identity enabled",
      ),
    ),
  );

const clientTypeValidator = fieldValidator(
  VALID_CLIENT_TYPES,
  "ClientType",
).adaptedFrom((client: Client) => client.ClientType);

export const allValidators = backChannelLogoutUriValidator
  .and(channelValidator)
  .and(claimsValidator)
  .and(clientLoCsValidator)
  .and(clientNameValidator)
  .and(clientSecretValidator)
  .and(clientTypeValidator);
