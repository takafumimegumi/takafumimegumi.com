import { describe, expect, it, vi } from "vitest";
import type { AvailabilityRules, BusyTime } from "../types";
import { listOpenSlots } from "./listOpenSlots";

// Made-up rules: Mondays from 10:00 to 12:00. The real ones live in Worker configuration.
// Vancouver is UTC-7, so 10:00 there is 17:00 UTC.
const MOCK_RULES: AvailabilityRules = {
  windows: { "1": [[600, 720]] },
  slotMinutes: 30,
  minNoticeMinutes: 0,
  daysOffered: 1,
  bufferMinutes: 15,
};

// Monday 2026-11-16, 08:00 in Vancouver.
const MONDAY_MORNING = new Date("2026-11-16T15:00:00Z");

const buildDependencies = (busyTimes: BusyTime[] = []) => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  listBusyTimes: vi.fn(async () => busyTimes),
});

describe("listOpenSlots", () => {
  it("returns the slots that my busy times leave open", async () => {
    // Busy from 10:30 to 11:00. With the buffer, only the 11:30 slot stays clear of it.
    const dependencies = buildDependencies([
      {
        start: new Date("2026-11-16T17:30:00Z"),
        end: new Date("2026-11-16T18:00:00Z"),
      },
    ]);

    const result = await listOpenSlots(
      dependencies,
      MOCK_RULES,
      MONDAY_MORNING,
    );

    expect(result).toEqual({
      ok: true,
      slots: [new Date("2026-11-16T18:30:00Z")],
    });
  });

  it("reads busy times from one buffer before now to one buffer after the days offered", async () => {
    const dependencies = buildDependencies();

    await listOpenSlots(dependencies, MOCK_RULES, MONDAY_MORNING);

    expect(dependencies.listBusyTimes).toHaveBeenCalledWith(
      new Date("2026-11-16T14:45:00Z"),
      new Date("2026-11-17T15:15:00Z"),
    );
  });

  it("returns rate_limited without reading the calendar when the limit is reached", async () => {
    const dependencies = buildDependencies();
    dependencies.checkRateLimit.mockResolvedValue({ allowed: false });

    const result = await listOpenSlots(
      dependencies,
      MOCK_RULES,
      MONDAY_MORNING,
    );

    expect(result).toEqual({ ok: false, reason: "rate_limited" });
    expect(dependencies.listBusyTimes).not.toHaveBeenCalled();
  });

  it("lets a failure from the calendar throw", async () => {
    const dependencies = buildDependencies();
    const failure = new Error("google_calendar:list_busy_times:500");
    dependencies.listBusyTimes.mockRejectedValue(failure);

    await expect(
      listOpenSlots(dependencies, MOCK_RULES, MONDAY_MORNING),
    ).rejects.toBe(failure);
  });
});
