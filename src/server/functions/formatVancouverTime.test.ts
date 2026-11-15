import { describe, expect, it } from "vitest";
import { formatVancouverTime } from "./formatVancouverTime";

const format = (time: string) => formatVancouverTime(new Date(time));

describe("formatVancouverTime", () => {
  it("writes 17:00 UTC as 10:00 AM, in January too", () => {
    expect(format("2026-11-20T17:00:00Z")).toBe("Nov 20, 10:00 AM");
    expect(format("2027-01-18T17:00:00Z")).toBe("Jan 18, 10:00 AM");
  });

  it("writes the minutes with two digits", () => {
    expect(format("2026-11-20T16:05:00Z")).toBe("Nov 20, 9:05 AM");
  });

  it("writes 11:59 as AM and noon as 12:00 PM", () => {
    expect(format("2026-11-20T18:59:00Z")).toBe("Nov 20, 11:59 AM");
    expect(format("2026-11-20T19:00:00Z")).toBe("Nov 20, 12:00 PM");
  });

  it("writes 11:59 PM, and then midnight as 12:00 AM on the next day", () => {
    expect(format("2026-11-21T06:59:00Z")).toBe("Nov 20, 11:59 PM");
    expect(format("2026-11-21T07:00:00Z")).toBe("Nov 21, 12:00 AM");
  });

  it("uses the Vancouver date when UTC is already on the next day", () => {
    expect(format("2026-12-01T03:00:00Z")).toBe("Nov 30, 8:00 PM");
  });
});
