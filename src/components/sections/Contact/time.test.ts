import { describe, expect, it } from "vitest";
import {
  formatDay,
  buildWeeks,
  formatDateParts,
  formatDateRange,
  formatLongDay,
  formatTime,
  formatTimeRange,
  formatTimeZoneName,
  groupSlotsByDay,
} from "./time";

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

describe("groupSlotsByDay", () => {
  // In Tokyo, 14:30 UTC is 23:30 and 15:00 UTC is midnight.
  const slots = [
    "2026-11-16T14:30:00.000Z",
    "2026-11-16T15:00:00.000Z",
    "2026-11-17T01:00:00.000Z",
  ];

  it("starts a new day at the visitor's midnight", () => {
    expect(groupSlotsByDay(slots, TOKYO)).toEqual([
      { date: "2026-11-16", slots: ["2026-11-16T14:30:00.000Z"] },
      {
        date: "2026-11-17",
        slots: ["2026-11-16T15:00:00.000Z", "2026-11-17T01:00:00.000Z"],
      },
    ]);
  });

  it("puts the same times on one day in another time zone", () => {
    expect(groupSlotsByDay(slots, PHOENIX)).toEqual([
      { date: "2026-11-16", slots },
    ]);
  });

  it("orders the times, earliest first", () => {
    const days = groupSlotsByDay([...slots].reverse(), PHOENIX);

    expect(days).toEqual([{ date: "2026-11-16", slots }]);
  });

  it("returns no days when there are no times", () => {
    expect(groupSlotsByDay([], TOKYO)).toEqual([]);
  });
});

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

describe("buildWeeks", () => {
  // In Phoenix these are Monday the 16th, Wednesday the 18th, and Monday the 23rd.
  const slots = [
    "2026-11-16T17:00:00.000Z",
    "2026-11-18T17:00:00.000Z",
    "2026-11-23T17:00:00.000Z",
  ];

  it("starts the first week on the first day with an open time", () => {
    const [firstWeek] = buildWeeks(slots, PHOENIX);

    expect(firstWeek.map((day) => day.date)).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });

  it("keeps a day without open times, with no slots", () => {
    const [firstWeek] = buildWeeks(slots, PHOENIX);

    expect(firstWeek[0].slots).toEqual(["2026-11-16T17:00:00.000Z"]);
    expect(firstWeek[1].slots).toEqual([]);
    expect(firstWeek[2].slots).toEqual(["2026-11-18T17:00:00.000Z"]);
  });

  it("starts a second week on the eighth day, and not on the seventh", () => {
    expect(buildWeeks(slots, PHOENIX)).toHaveLength(2);
    expect(buildWeeks(slots.slice(0, 2), PHOENIX)).toHaveLength(1);
    // Sunday the 22nd is the seventh day.
    const upToSunday = [slots[0], "2026-11-22T17:00:00.000Z"];
    expect(buildWeeks(upToSunday, PHOENIX)).toHaveLength(1);
  });

  it("returns no weeks when there are no times", () => {
    expect(buildWeeks([], PHOENIX)).toEqual([]);
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
