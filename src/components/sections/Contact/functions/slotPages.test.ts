import { describe, expect, it } from "vitest";
import { buildDayPages, groupSlotsByDay } from "./slotPages";

// Neither zone changes its clock, so the expected days hold all year.
const TOKYO = "Asia/Tokyo"; // UTC+9
const PHOENIX = "America/Phoenix"; // UTC-7

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

describe("buildDayPages", () => {
  // In Phoenix these are Monday the 16th, Wednesday the 18th, and Monday the 23rd.
  const slots = [
    "2026-11-16T17:00:00.000Z",
    "2026-11-18T17:00:00.000Z",
    "2026-11-23T17:00:00.000Z",
  ];

  it("starts the first page on the first day with an open time", () => {
    const [firstPage] = buildDayPages(slots, PHOENIX, 7);

    expect(firstPage.map((day) => day.date)).toEqual([
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
    const [firstPage] = buildDayPages(slots, PHOENIX, 7);

    expect(firstPage[0].slots).toEqual(["2026-11-16T17:00:00.000Z"]);
    expect(firstPage[1].slots).toEqual([]);
    expect(firstPage[2].slots).toEqual(["2026-11-18T17:00:00.000Z"]);
  });

  it("starts a second page on the day after the first page ends, and not before", () => {
    expect(buildDayPages(slots, PHOENIX, 7)).toHaveLength(2);
    // Sunday the 22nd is the seventh day.
    const upToSunday = [slots[0], "2026-11-22T17:00:00.000Z"];
    expect(buildDayPages(upToSunday, PHOENIX, 7)).toHaveLength(1);
  });

  it("leaves no day out between pages of three days", () => {
    const pages = buildDayPages(slots, PHOENIX, 3);

    // The 16th to the 23rd is eight days: three pages, the last one filled up with empty days.
    expect(pages.map((page) => page.map((day) => day.date))).toEqual([
      ["2026-11-16", "2026-11-17", "2026-11-18"],
      ["2026-11-19", "2026-11-20", "2026-11-21"],
      ["2026-11-22", "2026-11-23", "2026-11-24"],
    ]);
  });

  it("returns no pages when there are no times", () => {
    expect(buildDayPages([], PHOENIX, 7)).toEqual([]);
  });
});
