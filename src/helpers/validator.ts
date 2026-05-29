export interface Valid {
  isValid: true;
}
export interface Invalid {
  isValid: false;
  reasons: string[];
}

export type ValidationResult = Valid | Invalid;

export const valid = (): ValidationResult => ({ isValid: true });

export const invalid = (errors: string[]): ValidationResult => ({
  isValid: false,
  reasons: [...errors],
});
export class Validator<T> {
  constructor(
    private readonly verify: (
      value: T,
    ) => ValidationResult | Promise<ValidationResult>,
  ) {}

  async validate(value: T): Promise<ValidationResult> {
    return this.verify(value);
  }

  and(other: Validator<T>): Validator<T> {
    return new Validator(async (value) => {
      const [v1, v2] = await Promise.all([
        this.verify(value),
        other.verify(value),
      ]);

      if (!v1.isValid || !v2.isValid) {
        return invalid([
          ...(v1.isValid ? [] : v1.reasons),
          ...(v2.isValid ? [] : v2.reasons),
        ]);
      }
      return valid();
    });
  }

  or(other: Validator<T>): Validator<T> {
    return new Validator(async (value) => {
      const v1 = await this.verify(value);
      if (v1.isValid) return v1;

      const v2 = await other.verify(value);
      if (v2.isValid) return v2;

      return invalid([...v1.reasons, ...v2.reasons]);
    });
  }

  adaptedFrom<U>(transformer: (input: U) => T): Validator<U> {
    return new Validator((input) => this.validate(transformer(input)));
  }
}

export const rule = <T>(
  predicate: (input: T) => boolean | Promise<boolean>,
  error: string | ((input: T) => string),
): Validator<T> => {
  return new Validator(async (input) =>
    (await predicate(input))
      ? valid()
      : typeof error === "string"
        ? invalid([error])
        : invalid([error(input)]),
  );
};

export const when = <T>(
  predicate: (input: T) => boolean,
  validator: Validator<T>,
): Validator<T> => {
  return new Validator((input) =>
    predicate(input) ? validator.validate(input) : valid(),
  );
};
