import { describe, expect, it } from "vitest";
import type { AvailabilityRules, BusyTime } from "../types";
import { computeOpenSlots } from "./computeOpenSlots";

// Made-up rules: Mondays from 10:00 to 12:00. The real ones live in Worker configuration.
// Vancouver is UTC-7, so 10:00 there is 17:00 UTC, in winter too.
const MOCK_RULES: AvailabilityRules = {
  windows: { "1": [[600, 720]] },
  slotMinutes: 30,
  minNoticeMinutes: 0,
  daysOffered: 1,
  bufferMinutes: 0,
};

// Monday 2026-11-16, 08:00 in Vancouver.
const MONDAY_MORNING = new Date("2026-11-16T15:00:00Z");

const buildRules = (
  changes: Partial<AvailabilityRules>,
): AvailabilityRules => ({
  ...MOCK_RULES,
  ...changes,
});

const buildBusyTime = (start: string, end: string): BusyTime => ({
  start: new Date(start),
  end: new Date(end),
});

const formatSlots = (slots: Date[]) => slots.map((slot) => slot.toISOString());

describe("computeOpenSlots", () => {
  it("fills a window with slots, in UTC-7 in November", () => {
    expect(
      formatSlots(computeOpenSlots(MOCK_RULES, [], MONDAY_MORNING)),
    ).toEqual([
      "2026-11-16T17:00:00.000Z",
      "2026-11-16T17:30:00.000Z",
      "2026-11-16T18:00:00.000Z",
      "2026-11-16T18:30:00.000Z",
    ]);
  });

  it("offers no slot that would run past the end of a window", () => {
    const slots = computeOpenSlots(
      buildRules({ windows: { "1": [[600, 705]] } }),
      [],
      MONDAY_MORNING,
    );

    // 10:00 to 11:45 fits three 30-minute slots. A fourth would end at 12:00.
    expect(slots).toHaveLength(3);
  });

  it("returns slots from several windows in time order", () => {
    const slots = computeOpenSlots(
      buildRules({
        windows: {
          "1": [
            [840, 870],
            [600, 630],
          ],
        },
      }),
      [],
      MONDAY_MORNING,
    );

    expect(formatSlots(slots)).toEqual([
      "2026-11-16T17:00:00.000Z",
      "2026-11-16T21:00:00.000Z",
    ]);
  });

  it("offers nothing on a weekday without windows", () => {
    const sunday = new Date("2026-11-15T15:00:00Z");

    expect(computeOpenSlots(MOCK_RULES, [], sunday)).toEqual([]);
  });

  describe("minimum notice", () => {
    // 09:00 in Vancouver, so a 60-minute notice ends exactly at the 10:00 slot.
    const nineOClock = new Date("2026-11-16T16:00:00Z");

    it("keeps a slot that starts exactly when the notice ends", () => {
      const slots = computeOpenSlots(
        buildRules({ minNoticeMinutes: 60 }),
        [],
        nineOClock,
      );

      expect(formatSlots(slots)[0]).toBe("2026-11-16T17:00:00.000Z");
    });

    it("drops a slot that starts one minute before the notice ends", () => {
      const slots = computeOpenSlots(
        buildRules({ minNoticeMinutes: 61 }),
        [],
        nineOClock,
      );

      expect(formatSlots(slots)[0]).toBe("2026-11-16T17:30:00.000Z");
    });
  });

  describe("days offered", () => {
    const everyDay = buildRules({
      windows: Object.fromEntries(
        ["0", "1", "2", "3", "4", "5", "6"].map((day) => [day, [[600, 630]]]),
      ),
    });

    it("counts today as the first day", () => {
      const slots = computeOpenSlots(
        { ...everyDay, daysOffered: 2 },
        [],
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)).toEqual([
        "2026-11-16T17:00:00.000Z",
        "2026-11-17T17:00:00.000Z",
      ]);
    });

    it("uses the Vancouver date, not the UTC date, to decide what today is", () => {
      // Monday 23:59 in Vancouver is already Tuesday in UTC.
      const lateMonday = new Date("2026-11-17T06:59:00Z");
      const lateWindow = { ...everyDay, daysOffered: 1 };

      // Monday's 10:00 slot has passed, and Tuesday is outside the one day offered.
      expect(computeOpenSlots(lateWindow, [], lateMonday)).toEqual([]);
    });

    it("moves to the next day at midnight in Vancouver", () => {
      // Tuesday 00:00 in Vancouver.
      const midnight = new Date("2026-11-17T07:00:00Z");

      expect(
        formatSlots(
          computeOpenSlots({ ...everyDay, daysOffered: 1 }, [], midnight),
        ),
      ).toEqual(["2026-11-17T17:00:00.000Z"]);
    });
  });

  describe("busy time", () => {
    it("removes a slot that overlaps a busy time", () => {
      const slots = computeOpenSlots(
        MOCK_RULES,
        [buildBusyTime("2026-11-16T17:15:00Z", "2026-11-16T17:45:00Z")],
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)).toEqual([
        "2026-11-16T18:00:00.000Z",
        "2026-11-16T18:30:00.000Z",
      ]);
    });

    it("keeps slots that only touch a busy time", () => {
      const slots = computeOpenSlots(
        MOCK_RULES,
        [buildBusyTime("2026-11-16T17:30:00Z", "2026-11-16T18:00:00Z")],
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)).toEqual([
        "2026-11-16T17:00:00.000Z",
        "2026-11-16T18:00:00.000Z",
        "2026-11-16T18:30:00.000Z",
      ]);
    });

    it("removes a slot that overlaps by one minute", () => {
      const slots = computeOpenSlots(
        MOCK_RULES,
        [buildBusyTime("2026-11-16T17:29:00Z", "2026-11-16T18:00:00Z")],
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)[0]).toBe("2026-11-16T18:00:00.000Z");
    });
  });

  describe("buffer", () => {
    const meeting = [
      buildBusyTime("2026-11-16T17:45:00Z", "2026-11-16T18:00:00Z"),
    ];

    it("keeps a slot that ends exactly one buffer before a busy time", () => {
      // The 10:00 slot ends at 10:30, 15 minutes before the meeting.
      const slots = computeOpenSlots(
        buildRules({ bufferMinutes: 15 }),
        meeting,
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)[0]).toBe("2026-11-16T17:00:00.000Z");
    });

    it("removes a slot that ends inside the buffer", () => {
      const slots = computeOpenSlots(
        buildRules({ bufferMinutes: 16 }),
        meeting,
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)[0]).not.toBe("2026-11-16T17:00:00.000Z");
    });

    it("applies the buffer after a busy time too", () => {
      // The meeting ends at 11:00, so with a 15-minute buffer 11:00 is closed.
      const slots = computeOpenSlots(
        buildRules({ bufferMinutes: 15 }),
        meeting,
        MONDAY_MORNING,
      );

      expect(formatSlots(slots)).toEqual([
        "2026-11-16T17:00:00.000Z",
        "2026-11-16T18:30:00.000Z",
      ]);
    });
  });
});
