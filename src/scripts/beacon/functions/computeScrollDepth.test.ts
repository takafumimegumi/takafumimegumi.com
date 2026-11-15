import { describe, expect, it } from "vitest";
import { computeScrollDepth } from "./computeScrollDepth";

describe("computeScrollDepth", () => {
  it("counts the first screen at the top of the page", () => {
    expect(computeScrollDepth(0, 800, 4000)).toBe(20);
  });

  it("reaches 100 at the bottom of the page", () => {
    expect(computeScrollDepth(3200, 800, 4000)).toBe(100);
  });

  it("stays at 100 when the browser scrolls past the end", () => {
    expect(computeScrollDepth(3300, 800, 4000)).toBe(100);
  });

  it("is 100 for a page that fits on the screen", () => {
    expect(computeScrollDepth(0, 800, 600)).toBe(100);
  });
});
