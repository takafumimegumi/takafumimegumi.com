import * as Sentry from "@sentry/cloudflare";

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

/** Reads the code that the clients and the Email Service put on their errors. */
function readFailureKind(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string") return code;
  // An error message can echo form input, so only the error's name is used.
  return error instanceof Error ? error.name : "unknown";
}
