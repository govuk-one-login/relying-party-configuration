import { Client, VALID_CHANNELS, VALID_CLAIMS } from "../models/client";
import { invalid, rule, valid, Validator, optional } from "./validator";

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

export const allValidators = backChannelLogoutUriValidator.and(channelValidator).and(claimsValidator);
