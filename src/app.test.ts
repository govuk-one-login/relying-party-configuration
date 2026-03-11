import { describe, expect, it } from "vitest";
import { add } from "./app";

describe("Temporary test", () => {
  it("should add 2 numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
