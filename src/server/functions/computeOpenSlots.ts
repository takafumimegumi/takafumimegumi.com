import type { AvailabilityRules, Weekday } from "./availabilityRules";

// Vancouver stays on UTC-7 all year since March 2026.
// A fixed offset avoids time zone data, which is stale in some runtimes.
const VANCOUVER_UTC_OFFSET_MS = -7 * 60 * 60 * 1000;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// 1970-01-01 was a Thursday.
const EPOCH_WEEKDAY = 4;

/** A stretch of time when I am not free, such as another meeting. */
export interface BusyTime {
  start: Date;
  end: Date;
}

/** Returns the start of every open slot, earliest first. */
export function computeOpenSlots(
  rules: AvailabilityRules,
  busyTimes: BusyTime[],
  now: Date,
): Date[] {
  const slotLengthMs = rules.slotMinutes * MINUTE_MS;
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
        slotStartMs += slotLengthMs
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
