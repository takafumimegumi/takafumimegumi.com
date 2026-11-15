import { describe, expect, it } from "vitest";
import { buildFailure } from "./buildFailure";

describe("buildFailure", () => {
  it("carries a code made of the service, the operation, and the detail", () => {
    const failure = buildFailure("turnstile", "verify_token", "timeout");

    expect(failure).toBeInstanceOf(Error);
    expect(failure).toMatchObject({ code: "turnstile:verify_token:timeout" });
  });
});
