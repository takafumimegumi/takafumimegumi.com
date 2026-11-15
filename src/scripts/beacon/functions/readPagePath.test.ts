import { describe, expect, it } from "vitest";
import { readPagePath } from "./readPagePath";

describe("readPagePath", () => {
  it("keeps the path of a page", () => {
    expect(readPagePath("/projects/atras/")).toBe("/projects/atras/");
  });

  it("keeps the home page", () => {
    expect(readPagePath("/")).toBe("/");
  });

  it("replaces a path with a capital letter in it", () => {
    expect(readPagePath("/Projects/Atras/")).toBe("/unknown/");
  });

  it("replaces a path with an encoded character in it", () => {
    expect(readPagePath("/caf%C3%A9/")).toBe("/unknown/");
  });

  it("keeps a path of 100 characters", () => {
    const path = `/${"a".repeat(99)}`;

    expect(readPagePath(path)).toBe(path);
  });

  it("replaces a path of 101 characters", () => {
    expect(readPagePath(`/${"a".repeat(100)}`)).toBe("/unknown/");
  });
});
