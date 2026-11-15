import type { RateLimitCheck } from "../clients/cloudflareRateLimit";
import { computeBusyTimeRange } from "../functions/computeBusyTimeRange";
import { computeOpenSlots } from "../functions/computeOpenSlots";
import type { AvailabilityRules, BusyTime } from "../types";

interface ListOpenSlotsDependencies {
  checkRateLimit: () => Promise<RateLimitCheck>;
  listBusyTimes: (from: Date, to: Date) => Promise<BusyTime[]>;
}

type ListOpenSlotsResult =
  { ok: true; slots: Date[] } | { ok: false; reason: "rate_limited" };

/** Lists the start of every time a visitor can book: the rules minus my busy times (ADR-0007). */
export async function listOpenSlots(
  dependencies: ListOpenSlotsDependencies,
  rules: AvailabilityRules,
  now: Date,
): Promise<ListOpenSlotsResult> {
  const rateLimit = await dependencies.checkRateLimit();
  if (!rateLimit.allowed) return { ok: false, reason: "rate_limited" };

  const { from, to } = computeBusyTimeRange(rules, now);
  const busyTimes = await dependencies.listBusyTimes(from, to);

  return { ok: true, slots: computeOpenSlots(rules, busyTimes, now) };
}
