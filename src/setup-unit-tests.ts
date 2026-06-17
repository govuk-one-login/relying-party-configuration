import "aws-sdk-client-mock-vitest/extend";
import { expect } from "vitest";
import { ValidationResult } from "./helpers/validator.js";

interface CustomMatchers<R = unknown> {
  toBeValid(): R;
  toBeInvalid(): R;
  toHaveInvalidReasons(expectedReasons: string[]): R;
}

declare module "vitest" {
  interface Assertion<T> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  toBeValid(received: ValidationResult) {
    const pass = received.isValid;

    return {
      pass,
      message: (): string =>
        pass
          ? `Expected validation result NOT to be valid, but it passed.`
          : `Expected validation result to be valid, but it failed with reasons:\n${this.utils.printReceived(
              received.reasons,
            )}`,
    };
  },

  toBeInvalid(received: ValidationResult) {
    const pass = !received.isValid;

    return {
      pass,
      options: { isNot: this.isNot },
      message: (): string =>
        pass
          ? `Expected validation result NOT to be invalid, but it failed.`
          : `Expected validation result to be invalid, but it passed successfully.`,
    };
  },

  toHaveInvalidReasons(received: ValidationResult, expectedReasons: string[]) {
    const isInvalid = !received.isValid;

    if (!isInvalid) {
      return {
        pass: false,
        message: (): string =>
          `Expected validation result to have specific reasons, but it passed successfully without errors.`,
      };
    }

    const pass = this.equals(received.reasons, expectedReasons);

    return {
      pass,
      message: (): string =>
        `Validation failed as expected, but the error reasons did not match.\n\n` +
        `Expected: ${this.utils.printExpected(expectedReasons)}\n` +
        `Received: ${this.utils.printReceived(received.reasons)}`,
    };
  },
});
