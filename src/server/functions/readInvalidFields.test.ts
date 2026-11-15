import { describe, expect, it } from "vitest";
import { readInvalidFields } from "./readInvalidFields";

describe("readInvalidFields", () => {
  it("names each refused field", () => {
    const fields = readInvalidFields([{ path: ["name"] }, { path: ["email"] }]);

    expect(fields).toEqual(["name", "email"]);
  });

  it("names a field once when it has several problems", () => {
    const fields = readInvalidFields([
      { path: ["email"] },
      { path: ["email"] },
    ]);

    expect(fields).toEqual(["email"]);
  });

  it("names no field for a problem with the request as a whole", () => {
    expect(readInvalidFields([{ path: [] }])).toEqual([]);
  });
});
