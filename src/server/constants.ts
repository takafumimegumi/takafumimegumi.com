export const MINUTE_MS = 60 * 1000;
export const DAY_MS = 24 * 60 * MINUTE_MS;

// Vancouver stays on UTC-7 all year since March 2026.
// A fixed offset avoids time zone data, which is stale in some runtimes.
export const VANCOUVER_UTC_OFFSET_MS = -7 * 60 * 60 * 1000;
