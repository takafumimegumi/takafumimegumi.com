import type { AnalyticsEngineDataset } from "@cloudflare/workers-types";
import { buildFailure } from "../functions/buildFailure";

/** One beacon as it is stored (ADR-0008). */
export interface BeaconPoint {
  /** The hostname that received the beacon. A version preview URL has its own. */
  host: string;
  kind: string;
  path: string;
  /** The source tag of the link the visit came from, or an empty string. */
  source: string;
  /** Ties the beacons of one page load together. */
  viewId: string;
  seconds: number;
  /** The deepest scroll position, from 0 to 100. */
  depth: number;
}

/**
 * Stores one beacon. The write happens in the background and reports nothing back,
 * so a point that is dropped later cannot be noticed here.
 */
export function createBeaconPoint(
  dataset: AnalyticsEngineDataset,
  point: BeaconPoint,
): void {
  try {
    // The report script reads these columns by position.
    dataset.writeDataPoint({
      indexes: [point.host],
      blobs: [point.kind, point.path, point.source, point.viewId],
      doubles: [point.seconds, point.depth],
    });
  } catch {
    throw buildFailure(
      "cloudflare_analytics_engine",
      "create_beacon_point",
      "unknown",
    );
  }
}
