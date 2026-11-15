import { describe, expect, it } from "vitest";
import { readVisitOptions } from "./readVisitOptions";

const read = (pathAndQuery: string) =>
  readVisitOptions(`https://example.com${pathAndQuery}`);

describe("readVisitOptions", () => {
  it("reads nothing from a URL without the parameters, and leaves it alone", () => {
    expect(read("/projects/atras/?page=2#top")).toEqual({ source: "" });
  });

  it("reads the source tag and removes it from the URL", () => {
    expect(read("/?from=resume")).toEqual({
      source: "resume",
      cleanedUrl: "/",
    });
  });

  it("keeps the other parameters and the hash", () => {
    expect(read("/?page=2&from=resume#contact").cleanedUrl).toBe(
      "/?page=2#contact",
    );
  });

  it("ignores a source tag with a capital letter, and still removes it", () => {
    expect(read("/?from=Resume")).toEqual({ source: "", cleanedUrl: "/" });
  });

  it("accepts a source tag of 40 characters", () => {
    const tag = "a".repeat(40);

    expect(read(`/?from=${tag}`).source).toBe(tag);
  });

  it("ignores a source tag of 41 characters", () => {
    expect(read(`/?from=${"a".repeat(41)}`).source).toBe("");
  });

  it("reads a request to turn measurement off", () => {
    expect(read("/?measure=off")).toEqual({
      source: "",
      measure: "off",
      cleanedUrl: "/",
    });
  });

  it("reads a request to turn measurement back on", () => {
    expect(read("/?measure=on").measure).toBe("on");
  });

  it("ignores any other value for measurement", () => {
    expect(read("/?measure=maybe").measure).toBeUndefined();
  });
});
