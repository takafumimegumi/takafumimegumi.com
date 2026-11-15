import * as Sentry from "@sentry/cloudflare";
import { readFailureCode } from "../functions/readFailureCode";

/**
 * Reports a failure so that I get an alert (ADR-0010). Sends the source, such as "bookings", and the kind only.
 * The SDK is set up in src/worker.ts, so this takes no config.
 */
export function reportFailure(source: string, error: unknown): void {
  const kind = readFailureKind(error);
  console.error(source, kind);
  Sentry.withScope((scope) => {
    scope.setTag("source", source);
    // One issue per source and kind, so a new kind of failure raises a new alert.
    scope.setFingerprint([source, kind]);
    Sentry.captureMessage(`${source}: ${kind}`, "error");
  });
}

/** The code that the clients put on their errors, or the error's name. */
function readFailureKind(error: unknown): string {
  const code = readFailureCode(error);
  if (code) return code;
  // An error message can echo form input, so only the error's name is used.
  return error instanceof Error ? error.name : "unknown";
}
