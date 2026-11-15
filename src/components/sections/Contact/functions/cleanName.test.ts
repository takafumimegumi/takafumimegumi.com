import { describe, expect, it } from "vitest";
import { cleanName } from "./cleanName";

describe("cleanName", () => {
  it("turns a tab or a line break inside a name into one space", () => {
    expect(cleanName("Jane\tDoe")).toBe("Jane Doe");
    expect(cleanName("Jane\r\nDoe")).toBe("Jane Doe");
  });

  it("drops spaces and control characters around the name", () => {
    expect(cleanName(" \tJane Doe\n")).toBe("Jane Doe");
  });

  it("keeps letters of any script", () => {
    expect(cleanName("恵 貴文")).toBe("恵 貴文");
  });
});
