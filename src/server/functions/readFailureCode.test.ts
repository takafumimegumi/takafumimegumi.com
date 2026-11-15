import { describe, expect, it } from "vitest";
import { buildFailure } from "./buildFailure";
import { readFailureCode } from "./readFailureCode";

describe("readFailureCode", () => {
  it("reads the code from a failure", () => {
    const failure = buildFailure("turnstile", "verify_token", "timeout");

    expect(readFailureCode(failure)).toBe("turnstile:verify_token:timeout");
  });

  it("reads nothing from an error without a code", () => {
    expect(readFailureCode(new Error("no code"))).toBeUndefined();
  });

  it("reads nothing from a code that is not text, or from a value that is not an error", () => {
    expect(readFailureCode({ code: 500 })).toBeUndefined();
    expect(readFailureCode(null)).toBeUndefined();
  });
});
