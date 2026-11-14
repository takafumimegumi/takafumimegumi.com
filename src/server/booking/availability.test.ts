import { describe, expect, it } from "vitest";
import {
  availabilityRulesSchema,
  openSlots,
  type AvailabilityRules,
  type Interval,
} from "./availability";

// Made-up rules. The real ones live in Worker configuration.
// Vancouver is UTC-7, so 10:00 there is 17:00 UTC, in winter too.
const MOCK_RULES: AvailabilityRules = availabilityRulesSchema.parse({
  windows: { "1": [["10:00", "12:00"]] },
  slotMinutes: 30,
  minNoticeMinutes: 0,
  horizonDays: 1,
  bufferMinutes: 0,
});

// Monday 2026-11-16, 08:00 in Vancouver.
const MONDAY_MORNING = new Date("2026-11-16T15:00:00Z");

const rules = (changes: Partial<AvailabilityRules>): AvailabilityRules => ({
  ...MOCK_RULES,
  ...changes,
});

const busy = (start: string, end: string): Interval => ({
  start: new Date(start),
  end: new Date(end),
});

const iso = (slots: Date[]) => slots.map((slot) => slot.toISOString());

describe("openSlots", () => {
  it("fills a window with slots, in UTC-7 in November", () => {
    expect(iso(openSlots(MOCK_RULES, [], MONDAY_MORNING))).toEqual([
      "2026-11-16T17:00:00.000Z",
      "2026-11-16T17:30:00.000Z",
      "2026-11-16T18:00:00.000Z",
      "2026-11-16T18:30:00.000Z",
    ]);
  });

  it("offers no slot that would run past the end of a window", () => {
    const slots = openSlots(
      rules({ windows: { "1": [[600, 705]] } }),
      [],
      MONDAY_MORNING,
    );

    // 10:00 to 11:45 fits three 30-minute slots. A fourth would end at 12:00.
    expect(slots).toHaveLength(3);
  });

  it("returns slots from several windows in time order", () => {
    const slots = openSlots(
      rules({
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

    expect(iso(slots)).toEqual([
      "2026-11-16T17:00:00.000Z",
      "2026-11-16T21:00:00.000Z",
    ]);
  });

  it("offers nothing on a weekday without windows", () => {
    const sunday = new Date("2026-11-15T15:00:00Z");

    expect(openSlots(MOCK_RULES, [], sunday)).toEqual([]);
  });

  describe("minimum notice", () => {
    // 09:00 in Vancouver, so a 60-minute notice ends exactly at the 10:00 slot.
    const nineOClock = new Date("2026-11-16T16:00:00Z");

    it("keeps a slot that starts exactly when the notice ends", () => {
      const slots = openSlots(rules({ minNoticeMinutes: 60 }), [], nineOClock);

      expect(iso(slots)[0]).toBe("2026-11-16T17:00:00.000Z");
    });

    it("drops a slot that starts one minute before the notice ends", () => {
      const slots = openSlots(rules({ minNoticeMinutes: 61 }), [], nineOClock);

      expect(iso(slots)[0]).toBe("2026-11-16T17:30:00.000Z");
    });
  });

  describe("horizon", () => {
    const everyDay = rules({
      windows: Object.fromEntries(
        ["0", "1", "2", "3", "4", "5", "6"].map((day) => [day, [[600, 630]]]),
      ),
    });

    it("counts today as the first day", () => {
      const slots = openSlots(
        { ...everyDay, horizonDays: 2 },
        [],
        MONDAY_MORNING,
      );

      expect(iso(slots)).toEqual([
        "2026-11-16T17:00:00.000Z",
        "2026-11-17T17:00:00.000Z",
      ]);
    });

    it("uses the Vancouver date, not the UTC date, to decide what today is", () => {
      // Monday 23:30 in Vancouver is already Tuesday in UTC.
      const lateMonday = new Date("2026-11-17T06:30:00Z");
      const lateWindow = { ...everyDay, horizonDays: 1 };

      // Monday's 10:00 slot has passed, and Tuesday is outside a one-day horizon.
      expect(openSlots(lateWindow, [], lateMonday)).toEqual([]);
    });

    it("moves to the next day at midnight in Vancouver", () => {
      // Tuesday 00:00 in Vancouver.
      const midnight = new Date("2026-11-17T07:00:00Z");

      expect(
        iso(openSlots({ ...everyDay, horizonDays: 1 }, [], midnight)),
      ).toEqual(["2026-11-17T17:00:00.000Z"]);
    });
  });

  describe("busy time", () => {
    it("removes a slot that overlaps a busy interval", () => {
      const slots = openSlots(
        MOCK_RULES,
        [busy("2026-11-16T17:15:00Z", "2026-11-16T17:45:00Z")],
        MONDAY_MORNING,
      );

      expect(iso(slots)).toEqual([
        "2026-11-16T18:00:00.000Z",
        "2026-11-16T18:30:00.000Z",
      ]);
    });

    it("keeps slots that only touch a busy interval", () => {
      const slots = openSlots(
        MOCK_RULES,
        [busy("2026-11-16T17:30:00Z", "2026-11-16T18:00:00Z")],
        MONDAY_MORNING,
      );

      expect(iso(slots)).toEqual([
        "2026-11-16T17:00:00.000Z",
        "2026-11-16T18:00:00.000Z",
        "2026-11-16T18:30:00.000Z",
      ]);
    });

    it("removes a slot that overlaps by one minute", () => {
      const slots = openSlots(
        MOCK_RULES,
        [busy("2026-11-16T17:29:00Z", "2026-11-16T18:00:00Z")],
        MONDAY_MORNING,
      );

      expect(iso(slots)[0]).toBe("2026-11-16T18:00:00.000Z");
    });
  });

  describe("buffer", () => {
    const meeting = [busy("2026-11-16T17:45:00Z", "2026-11-16T18:00:00Z")];

    it("keeps a slot that ends exactly one buffer before a busy interval", () => {
      // The 10:00 slot ends at 10:30, 15 minutes before the meeting.
      const slots = openSlots(
        rules({ bufferMinutes: 15 }),
        meeting,
        MONDAY_MORNING,
      );

      expect(iso(slots)[0]).toBe("2026-11-16T17:00:00.000Z");
    });

    it("removes a slot that ends inside the buffer", () => {
      const slots = openSlots(
        rules({ bufferMinutes: 16 }),
        meeting,
        MONDAY_MORNING,
      );

      expect(iso(slots)[0]).not.toBe("2026-11-16T17:00:00.000Z");
    });

    it("applies the buffer after a busy interval too", () => {
      // The meeting ends at 11:00, so with a 15-minute buffer 11:00 is closed.
      const slots = openSlots(
        rules({ bufferMinutes: 15 }),
        meeting,
        MONDAY_MORNING,
      );

      expect(iso(slots)).toEqual([
        "2026-11-16T17:00:00.000Z",
        "2026-11-16T18:30:00.000Z",
      ]);
    });
  });
});

describe("availabilityRulesSchema", () => {
  const valid = {
    windows: { "1": [["10:00", "12:00"]] },
    slotMinutes: 30,
    minNoticeMinutes: 0,
    horizonDays: 14,
    bufferMinutes: 0,
  };

  it("reads times of day as minutes from midnight", () => {
    const parsed = availabilityRulesSchema.parse({
      ...valid,
      windows: { "5": [["09:30", "24:00"]] },
    });

    expect(parsed.windows["5"]).toEqual([[570, 1440]]);
  });

  it("rejects a window that ends before it starts", () => {
    const result = availabilityRulesSchema.safeParse({
      ...valid,
      windows: { "1": [["12:00", "10:00"]] },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a time that is not on the clock", () => {
    const result = availabilityRulesSchema.safeParse({
      ...valid,
      windows: { "1": [["10:00", "25:00"]] },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a weekday outside 0 to 6", () => {
    const result = availabilityRulesSchema.safeParse({
      ...valid,
      windows: { "7": [["10:00", "12:00"]] },
    });

    expect(result.success).toBe(false);
  });
});
