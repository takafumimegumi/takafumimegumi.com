import { z } from "astro/zod";

// Vancouver stays on UTC-7 all year since March 2026. Checked 2026-11-13.
// A fixed offset avoids time zone data, which is stale in some runtimes.
const VANCOUVER_OFFSET_MS = -7 * 60 * 60 * 1000;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// 1970-01-01 was a Thursday.
const EPOCH_WEEKDAY = 4;

/** A time of day in Vancouver, such as "09:30". "24:00" is the end of the day. */
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/)
  .transform((text) => {
    const [hours, minutes] = text.split(":").map(Number);
    return hours * 60 + minutes;
  });

const window = z
  .tuple([timeOfDay, timeOfDay])
  .refine(([start, end]) => start < end, "A window must end after it starts.");

export const availabilityRulesSchema = z.object({
  /** Open windows by weekday in Vancouver time. "0" is Sunday. */
  windows: z.partialRecord(
    z.enum(["0", "1", "2", "3", "4", "5", "6"]),
    z.array(window),
  ),
  slotMinutes: z.number().int().positive(),
  /** A slot must start at least this long after now. */
  minNoticeMinutes: z.number().int().nonnegative(),
  /** How many Vancouver days are offered, counting today. */
  horizonDays: z.number().int().positive(),
  /** Free time kept before and after every busy interval. */
  bufferMinutes: z.number().int().nonnegative(),
});

export type AvailabilityRules = z.infer<typeof availabilityRulesSchema>;

export interface Interval {
  start: Date;
  end: Date;
}

/** Returns the start of every open slot, earliest first. */
export function openSlots(
  rules: AvailabilityRules,
  busy: Interval[],
  now: Date,
): Date[] {
  const slotMs = rules.slotMinutes * MINUTE_MS;
  const bufferMs = rules.bufferMinutes * MINUTE_MS;
  const earliest = now.getTime() + rules.minNoticeMinutes * MINUTE_MS;
  const today = Math.floor((now.getTime() + VANCOUVER_OFFSET_MS) / DAY_MS);

  const slots: Date[] = [];
  for (let day = today; day < today + rules.horizonDays; day++) {
    const weekday = (((day + EPOCH_WEEKDAY) % 7) + 7) % 7;
    const midnight = day * DAY_MS - VANCOUVER_OFFSET_MS;
    const windows =
      rules.windows[String(weekday) as keyof typeof rules.windows];

    for (const [windowStart, windowEnd] of windows ?? []) {
      const lastStart = midnight + windowEnd * MINUTE_MS - slotMs;
      for (
        let start = midnight + windowStart * MINUTE_MS;
        start <= lastStart;
        start += slotMs
      ) {
        if (start < earliest) continue;
        const end = start + slotMs;
        const taken = busy.some(
          (interval) =>
            start - bufferMs < interval.end.getTime() &&
            end + bufferMs > interval.start.getTime(),
        );
        if (!taken) slots.push(new Date(start));
      }
    }
  }
  return slots.sort((a, b) => a.getTime() - b.getTime());
}
