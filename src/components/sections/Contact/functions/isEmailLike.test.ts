import { describe, expect, it } from "vitest";
import { isEmailLike } from "./isEmailLike";

describe("isEmailLike", () => {
  it("accepts an address, with or without spaces around it", () => {
    expect(isEmailLike("jane@example.com")).toBe(true);
    expect(isEmailLike(" jane@example.com ")).toBe(true);
  });

  it("rejects an address with no dot after the @, and one with no @", () => {
    expect(isEmailLike("jane@company")).toBe(false);
    expect(isEmailLike("jane")).toBe(false);
  });

  it("rejects an empty text and one with a space inside", () => {
    expect(isEmailLike("")).toBe(false);
    expect(isEmailLike("jane doe@example.com")).toBe(false);
  });
});
