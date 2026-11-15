import { describe, expect, it } from "vitest";
import type { AvailabilityRules } from "../types";
import { computeBusyTimeRange } from "./computeBusyTimeRange";
import { computeOpenSlots } from "./computeOpenSlots";

// Made-up rules: every day, all day. The real ones live in Worker configuration.
const MOCK_RULES: AvailabilityRules = {
  windows: Object.fromEntries(
    ["0", "1", "2", "3", "4", "5", "6"].map((weekday) => [
      weekday,
      [[0, 1440]],
    ]),
  ),
  slotMinutes: 30,
  slotIntervalMinutes: 30,
  minNoticeMinutes: 0,
  daysOffered: 2,
  bufferMinutes: 0,
};

// Monday 2026-11-16, 08:00 in Vancouver.
const NOW = new Date("2026-11-16T15:00:00Z");

describe("computeBusyTimeRange", () => {
  it("runs from now to the days offered after now, without a buffer", () => {
    const range = computeBusyTimeRange(MOCK_RULES, NOW);

    expect(range.from.toISOString()).toBe("2026-11-16T15:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-11-18T15:00:00.000Z");
  });

  it("widens both ends by the buffer", () => {
    const range = computeBusyTimeRange(
      { ...MOCK_RULES, bufferMinutes: 15 },
      NOW,
    );

    expect(range.from.toISOString()).toBe("2026-11-16T14:45:00.000Z");
    expect(range.to.toISOString()).toBe("2026-11-18T15:15:00.000Z");
  });

  it("covers the last slot of the last offered day and its buffer", () => {
    const rules = { ...MOCK_RULES, bufferMinutes: 15 };
    const lastSlot = computeOpenSlots(rules, [], NOW).at(-1)!;
    const lastSlotEndMs = lastSlot.getTime() + 30 * 60 * 1000;

    const range = computeBusyTimeRange(rules, NOW);

    expect(range.to.getTime()).toBeGreaterThanOrEqual(
      lastSlotEndMs + 15 * 60 * 1000,
    );
  });
});
