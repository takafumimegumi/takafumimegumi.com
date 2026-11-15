import type { TokenCheck } from "../types";

// The pages that may produce a token: the site, its workers.dev address, and its version URLs.
const SITE_HOSTNAME = "takafumimegumi.com";
const WORKER_HOSTNAME = "takafumimegumi-com.takafumimegumi.workers.dev";

/** Each form has its own action, so a token from one form cannot be used on the other. */
export type TokenAction = "booking" | "message";

/** A token counts only when it is valid, was made for this form, and came from this site. */
export function isTokenAccepted(
  check: TokenCheck,
  action: TokenAction,
): boolean {
  return (
    check.valid &&
    check.action === action &&
    isSiteHostname(check.hostname ?? "")
  );
}

function isSiteHostname(hostname: string): boolean {
  return (
    hostname === SITE_HOSTNAME ||
    hostname === WORKER_HOSTNAME ||
    // A version URL puts the version's ID and a hyphen in front.
    hostname.endsWith(`-${WORKER_HOSTNAME}`)
  );
}
