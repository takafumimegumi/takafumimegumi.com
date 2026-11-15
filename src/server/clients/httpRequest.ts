import { buildFailure } from "../functions/failureCode";

const TIMEOUT_MS = 10_000;

/** Names the caller in a failure code, such as "turnstile" and "verify_token". */
export interface RequestSource {
  service: string;
  operation: string;
}

/** A fetch that gives up after the timeout. Throws when no response arrives. */
export async function requestWithTimeout(
  source: RequestSource,
  url: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw buildFailure(
      source.service,
      source.operation,
      timedOut ? "timeout" : "network",
    );
  }
}

export async function readJson<Body>(
  source: RequestSource,
  response: Response,
): Promise<Body> {
  try {
    return (await response.json()) as Body;
  } catch {
    throw buildFailure(source.service, source.operation, "invalid_response");
  }
}
