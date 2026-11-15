import { z } from "astro/zod";
import type { AvailabilityRules, TimeWindow } from "../types";
import { buildFailure } from "./buildFailure";

/** A time of day such as "09:30", read as minutes from midnight. "24:00" is the end of the day. */
const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/)
  .transform((text) => {
    const [hours, minutes] = text.split(":").map(Number);
    return hours * 60 + minutes;
  });

const timeWindowSchema = z
  .tuple([timeOfDaySchema, timeOfDaySchema])
  .refine(([start, end]) => start < end, "A window must end after it starts.");

const availabilityRulesSchema = z
  .object({
    windows: z.partialRecord(
      z.enum(["0", "1", "2", "3", "4", "5", "6"]),
      z
        .array(timeWindowSchema)
        .refine(
          (windows) => !containsOverlap(windows),
          "Windows on one weekday must not overlap.",
        ),
    ),
    slotMinutes: z.number().int().positive(),
    slotIntervalMinutes: z.number().int().positive().optional(),
    minNoticeMinutes: z.number().int().nonnegative(),
    daysOffered: z.number().int().positive(),
    bufferMinutes: z.number().int().nonnegative(),
  })
  // Rules written before the interval existed start a slot when the one before ends.
  .transform((rules) => ({
    ...rules,
    slotIntervalMinutes: rules.slotIntervalMinutes ?? rules.slotMinutes,
  }));

/**
 * Reads the rules from their JSON text in Worker configuration.
 * Throws when the text is not valid rules, since nothing can be offered without them.
 */
export function parseAvailabilityRules(json: string): AvailabilityRules {
  const parsed = availabilityRulesSchema.safeParse(parseJson(json));
  if (!parsed.success) {
    throw buildFailure("availability_rules", "parse", "invalid");
  }
  return parsed.data;
}

/** Overlapping windows would offer the same slot twice. Windows that only touch are fine. */
function containsOverlap(windows: TimeWindow[]): boolean {
  const sorted = [...windows].sort(([a], [b]) => a - b);
  return sorted.some(
    ([start], index) => index > 0 && start < sorted[index - 1][1],
  );
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}
