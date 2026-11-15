import { describe, expect, it } from "vitest";
import {
  formatDateParts,
  formatDateRange,
  formatDay,
  formatLongDay,
  formatTime,
  formatTimeRange,
  formatTimeZoneName,
} from "./timeFormats";

// Neither zone changes its clock, so the expected times hold all year.
const TOKYO = "Asia/Tokyo"; // UTC+9
const PHOENIX = "America/Phoenix"; // UTC-7

// U+2009 and U+202F, built from their codes so that no invisible character sits in this file.
const NARROW_SPACES = new RegExp(
  `[${String.fromCharCode(0x2009, 0x202f)}]`,
  "g",
);

/** Intl puts narrow spaces around a dash and before AM or PM. */
function withPlainSpaces(text: string): string {
  return text.replace(NARROW_SPACES, " ");
}

describe("formatDay", () => {
  it("uses the visitor's date, not the UTC date", () => {
    expect(formatDay("2026-11-16T15:00:00.000Z", TOKYO)).toBe("Tue, Nov 17");
    expect(formatDay("2026-11-16T15:00:00.000Z", PHOENIX)).toBe("Mon, Nov 16");
  });
});

describe("formatLongDay", () => {
  it("uses the visitor's date", () => {
    expect(formatLongDay("2026-11-16T15:00:00.000Z", TOKYO)).toBe(
      "Tuesday, November 17",
    );
  });
});

describe("formatDateParts", () => {
  it("reads the weekday and the day from a local date", () => {
    expect(formatDateParts("2026-11-17")).toEqual({
      weekday: "Tue",
      dayOfMonth: "17",
    });
  });
});

describe("formatDateRange", () => {
  it("writes the month once when both dates share it", () => {
    const range = formatDateRange("2026-11-16", "2026-11-22");

    expect(withPlainSpaces(range)).toBe("Nov 16 – 22");
  });

  it("writes both months when the week crosses into the next one", () => {
    const range = formatDateRange("2026-11-30", "2026-12-06");

    expect(withPlainSpaces(range)).toBe("Nov 30 – Dec 6");
  });
});

describe("formatTime", () => {
  it("uses the visitor's clock", () => {
    const time = formatTime("2026-11-16T16:30:00.000Z", PHOENIX);

    expect(withPlainSpaces(time)).toBe("9:30 AM");
  });
});

describe("formatTimeRange", () => {
  it("writes AM once when the call starts and ends in the morning", () => {
    const range = formatTimeRange("2026-11-16T16:30:00.000Z", PHOENIX);

    expect(withPlainSpaces(range)).toBe("9:30 – 10:00 AM");
  });

  it("writes both AM and PM when the call ends at noon", () => {
    const range = formatTimeRange("2026-11-16T18:30:00.000Z", PHOENIX);

    expect(withPlainSpaces(range)).toBe("11:30 AM – 12:00 PM");
  });
});

describe("formatTimeZoneName", () => {
  it("drops the country note", () => {
    expect(formatTimeZoneName("America/Vancouver", "long")).toBe(
      "Pacific Time",
    );
    expect(formatTimeZoneName("America/Vancouver", "short")).toBe("PT");
  });
});
