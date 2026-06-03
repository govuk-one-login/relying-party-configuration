import { Client ,VALID_CHANNELS} from "../models/client";
import { optional, rule } from "./validator";

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

const fieldValidator = (validValues: readonly string[], fieldName: string) =>
  rule(
    (value: string) => validValues.includes(value),
    (value: string) => `Invalid ${fieldName} provided: "${value}"`,
  );

const backChannelLogoutUriValidator = optional(
  validUrlValidator("BackChannelLogoutUri")
    .and(notHttpValidator("BackChannelLogoutUri"))
    .and(notLocalhostValidator("BackChannelLogoutUri")),
).adaptedFrom((client: Client) => client.BackChannelLogoutUri);

const channelValidator = fieldValidator(VALID_CHANNELS, "Channel").adaptedFrom(
  (client: Client) => client.Channel,
);

export const allValidators = backChannelLogoutUriValidator.and(channelValidator);
