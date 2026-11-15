import { describe, expect, it } from "vitest";
import type { TokenCheck } from "../types";
import { isTokenAccepted } from "./isTokenAccepted";

const WORKER_HOSTNAME = "takafumimegumi-com.takafumimegumi.workers.dev";

const buildCheck = (changes: Partial<TokenCheck> = {}): TokenCheck => ({
  valid: true,
  action: "booking",
  hostname: "takafumimegumi.com",
  ...changes,
});

describe("isTokenAccepted", () => {
  it("accepts a valid token made for this form on the site", () => {
    expect(isTokenAccepted(buildCheck(), "booking")).toBe(true);
  });

  it("refuses a token that is not valid", () => {
    expect(isTokenAccepted(buildCheck({ valid: false }), "booking")).toBe(
      false,
    );
  });

  it("refuses a token made for the other form", () => {
    expect(isTokenAccepted(buildCheck({ action: "message" }), "booking")).toBe(
      false,
    );
  });

  it("refuses a token without an action", () => {
    expect(isTokenAccepted(buildCheck({ action: undefined }), "booking")).toBe(
      false,
    );
  });

  it("accepts the workers.dev address and a version URL", () => {
    for (const hostname of [WORKER_HOSTNAME, `1a2b3c4d-${WORKER_HOSTNAME}`]) {
      expect(isTokenAccepted(buildCheck({ hostname }), "booking")).toBe(true);
    }
  });

  it("refuses a hostname that only ends like the site's", () => {
    for (const hostname of [
      "eviltakafumimegumi.com",
      "takafumimegumi.com.example.com",
      `evil${WORKER_HOSTNAME}`,
      "takafumimegumi-com.someone-else.workers.dev",
    ]) {
      expect(isTokenAccepted(buildCheck({ hostname }), "booking")).toBe(false);
    }
  });

  it("refuses a token without a hostname", () => {
    expect(
      isTokenAccepted(buildCheck({ hostname: undefined }), "booking"),
    ).toBe(false);
  });
});
