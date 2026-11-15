import { describe, expect, it } from "vitest";
import { parseAvailabilityRules } from "./availabilityRules";

// Made-up rules. The real ones live in Worker configuration.
const MOCK_RULES = {
  windows: { "1": [["10:00", "12:00"]] },
  slotMinutes: 30,
  minNoticeMinutes: 0,
  daysOffered: 14,
  bufferMinutes: 0,
};

const parse = (changes: object = {}) =>
  parseAvailabilityRules(JSON.stringify({ ...MOCK_RULES, ...changes }));

describe("parseAvailabilityRules", () => {
  it("reads times of day as minutes from midnight", () => {
    const rules = parse({ windows: { "5": [["09:30", "24:00"]] } });

    expect(rules.windows["5"]).toEqual([[570, 1440]]);
  });

  it("keeps the numbers as they are", () => {
    expect(parse()).toMatchObject({
      slotMinutes: 30,
      minNoticeMinutes: 0,
      daysOffered: 14,
      bufferMinutes: 0,
    });
  });

  it("accepts a window of 1 minute and rejects one that ends when it starts", () => {
    expect(() =>
      parse({ windows: { "1": [["10:00", "10:01"]] } }),
    ).not.toThrow();
    expect(() => parse({ windows: { "1": [["10:00", "10:00"]] } })).toThrow();
  });

  it("accepts windows that touch and rejects windows that overlap by 1 minute", () => {
    const morning = ["10:00", "12:00"];

    expect(() =>
      parse({ windows: { "1": [morning, ["12:00", "14:00"]] } }),
    ).not.toThrow();
    expect(() =>
      parse({ windows: { "1": [["11:59", "14:00"], morning] } }),
    ).toThrow();
  });

  it("accepts 23:59 and rejects 25:00, which is not on the clock", () => {
    expect(() =>
      parse({ windows: { "1": [["10:00", "23:59"]] } }),
    ).not.toThrow();
    expect(() => parse({ windows: { "1": [["10:00", "25:00"]] } })).toThrow();
  });

  it("accepts weekday 6 and rejects weekday 7", () => {
    expect(() =>
      parse({ windows: { "6": [["10:00", "12:00"]] } }),
    ).not.toThrow();
    expect(() => parse({ windows: { "7": [["10:00", "12:00"]] } })).toThrow();
  });

  it("accepts a slot of 1 minute and rejects 0", () => {
    expect(() => parse({ slotMinutes: 1 })).not.toThrow();
    expect(() => parse({ slotMinutes: 0 })).toThrow();
  });

  it("accepts 1 day offered and rejects 0", () => {
    expect(() => parse({ daysOffered: 1 })).not.toThrow();
    expect(() => parse({ daysOffered: 0 })).toThrow();
  });

  it("accepts a notice of 0 minutes and rejects -1", () => {
    expect(() => parse({ minNoticeMinutes: 0 })).not.toThrow();
    expect(() => parse({ minNoticeMinutes: -1 })).toThrow();
  });

  it("accepts a buffer of 0 minutes and rejects -1", () => {
    expect(() => parse({ bufferMinutes: 0 })).not.toThrow();
    expect(() => parse({ bufferMinutes: -1 })).toThrow();
  });

  it("rejects text that is not JSON", () => {
    expect(() => parseAvailabilityRules("not json")).toThrow();
  });

  it("names the failure without repeating the rules", () => {
    expect(() => parseAvailabilityRules("{}")).toThrow(
      expect.objectContaining({ code: "availability_rules:parse:invalid" }),
    );
  });
});
