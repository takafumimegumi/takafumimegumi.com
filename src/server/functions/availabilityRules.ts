import { z } from "astro/zod";

export type Weekday = "0" | "1" | "2" | "3" | "4" | "5" | "6";

/** Start and end, as minutes from midnight in Vancouver. 600 is 10:00. */
export type TimeWindow = [start: number, end: number];

export interface AvailabilityRules {
  /** Open windows by weekday. "0" is Sunday. */
  windows: Partial<Record<Weekday, TimeWindow[]>>;
  slotMinutes: number;
  /** A slot must start at least this long after now. */
  minNoticeMinutes: number;
  /** How many Vancouver days are offered, counting today. */
  daysOffered: number;
  /** Free time kept before and after every busy time. */
  bufferMinutes: number;
}

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

const availabilityRulesSchema = z.object({
  windows: z.partialRecord(
    z.enum(["0", "1", "2", "3", "4", "5", "6"]),
    z.array(timeWindowSchema),
  ),
  slotMinutes: z.number().int().positive(),
  minNoticeMinutes: z.number().int().nonnegative(),
  daysOffered: z.number().int().positive(),
  bufferMinutes: z.number().int().nonnegative(),
});

/**
 * Reads the rules from their JSON text in Worker configuration.
 * Throws when the text is not valid rules, since nothing can be offered without them.
 */
export function parseAvailabilityRules(json: string): AvailabilityRules {
  const parsed = availabilityRulesSchema.safeParse(parseJson(json));
  if (!parsed.success) {
    const code = "availability_rules:invalid";
    throw Object.assign(new Error(code), { code });
  }
  return parsed.data;
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}
