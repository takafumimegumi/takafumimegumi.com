import type { AvailabilityRules } from "../types";
import { DAY_MS, MINUTE_MS } from "../constants";

export interface TimeRange {
  from: Date;
  to: Date;
}

/**
 * Returns the stretch of the calendar that computeOpenSlots needs busy times for.
 * A busy time just outside the offered days still removes slots that fall within its buffer.
 */
export function computeBusyTimeRange(
  rules: AvailabilityRules,
  now: Date,
): TimeRange {
  const bufferMs = rules.bufferMinutes * MINUTE_MS;
  // Today counts as the first day, so the last offered day ends within this many days of now.
  const offeredMs = rules.daysOffered * DAY_MS;

  return {
    from: new Date(now.getTime() - bufferMs),
    to: new Date(now.getTime() + offeredMs + bufferMs),
  };
}
