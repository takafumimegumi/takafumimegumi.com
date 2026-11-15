import { z } from "astro/zod";
import { BEACON_PATH_PATTERN, MAX_BEACON_SECONDS } from "@/siteConstants";
import type { BeaconPoint } from "../clients/cloudflareAnalyticsEngine";

const beaconRequestSchema = z.object({
  kind: z.enum([
    "opened",
    "left",
    "case_study_read",
    "call_booked",
    "message_sent",
  ]),
  // Any path of this shape is stored. A list of real pages would silently drop a new page.
  path: z.string().regex(BEACON_PATH_PATTERN),
  source: z
    .string()
    .max(40)
    .regex(/^[a-z0-9-]*$/)
    .default(""),
  viewId: z.uuid(),
  seconds: z.int().min(0).max(MAX_BEACON_SECONDS),
  depth: z.int().min(0).max(100),
});

interface CreateBeaconDependencies {
  createBeaconPoint: (point: BeaconPoint) => void;
}

type CreateBeaconResult = { ok: true } | { ok: false; reason: "invalid" };

/** Anyone can post here, so only the shape of a beacon is trusted, never what it claims (ADR-0008). */
export function createBeacon(
  dependencies: CreateBeaconDependencies,
  rawRequest: unknown,
  host: string,
): CreateBeaconResult {
  const parsed = beaconRequestSchema.safeParse(rawRequest);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const request = parsed.data;

  dependencies.createBeaconPoint({ host, ...request });

  return { ok: true };
}
