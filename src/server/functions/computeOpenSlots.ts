import { DAY_MS, MINUTE_MS } from "@/siteConstants";
import { VANCOUVER_UTC_OFFSET_MS } from "../constants";
import type { AvailabilityRules, BusyTime, Weekday } from "../types";

// 1970-01-01 was a Thursday.
const EPOCH_WEEKDAY = 4;

/** Returns the start of every open slot, earliest first. */
export function computeOpenSlots(
  rules: AvailabilityRules,
  busyTimes: BusyTime[],
  now: Date,
): Date[] {
  const slotLengthMs = rules.slotMinutes * MINUTE_MS;
  const slotIntervalMs = rules.slotIntervalMinutes * MINUTE_MS;
  const bufferMs = rules.bufferMinutes * MINUTE_MS;
  const earliestStartMs = now.getTime() + rules.minNoticeMinutes * MINUTE_MS;
  const todayNumber = Math.floor(
    (now.getTime() + VANCOUVER_UTC_OFFSET_MS) / DAY_MS,
  );

  const slots: Date[] = [];
  for (
    let dayNumber = todayNumber;
    dayNumber < todayNumber + rules.daysOffered;
    dayNumber++
  ) {
    const weekday = (((dayNumber + EPOCH_WEEKDAY) % 7) + 7) % 7;
    const midnightMs = dayNumber * DAY_MS - VANCOUVER_UTC_OFFSET_MS;
    const windows = rules.windows[String(weekday) as Weekday];

    for (const [windowStart, windowEnd] of windows ?? []) {
      const lastSlotStartMs = midnightMs + windowEnd * MINUTE_MS - slotLengthMs;
      for (
        let slotStartMs = midnightMs + windowStart * MINUTE_MS;
        slotStartMs <= lastSlotStartMs;
        slotStartMs += slotIntervalMs
      ) {
        if (slotStartMs < earliestStartMs) continue;
        const slotEndMs = slotStartMs + slotLengthMs;
        const overlapsBusyTime = busyTimes.some(
          (busyTime) =>
            slotStartMs - bufferMs < busyTime.end.getTime() &&
            slotEndMs + bufferMs > busyTime.start.getTime(),
        );
        if (!overlapsBusyTime) slots.push(new Date(slotStartMs));
      }
    }
  }
  return slots.sort((a, b) => a.getTime() - b.getTime());
}
