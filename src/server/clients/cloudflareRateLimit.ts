import type { RateLimit } from "@cloudflare/workers-types";
import { buildFailure } from "../functions/failureCode";

export interface RateLimitKey {
  /** The route being called, such as "bookings". Each route is counted on its own. */
  route: string;
  /** Without an address, as in local development, all visitors share one count. */
  visitorIp: string | null;
}

export interface RateLimitCheck {
  allowed: boolean;
}

/**
 * Counts one call against the limit set in wrangler.jsonc (ADR-0006).
 * The count is approximate and kept per Cloudflare location.
 */
export async function checkRateLimit(
  binding: RateLimit,
  { route, visitorIp }: RateLimitKey,
): Promise<RateLimitCheck> {
  try {
    const { success } = await binding.limit({
      key: `${route}:${visitorIp ?? "unknown"}`,
    });
    return { allowed: success };
  } catch {
    throw buildFailure("cloudflare_rate_limit", "check_rate_limit", "unknown");
  }
}
