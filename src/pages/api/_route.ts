import type { APIContext, APIRoute } from "astro";
import { reportFailure } from "@/server/clients/sentry";

// Far above the largest valid form, and small enough to read without care.
const MAX_BODY_BYTES = 16 * 1024;

/**
 * Wraps a route so that no error reaches Astro, which would log the error's message.
 * The failure is reported under the source, such as "bookings", and the visitor gets a 500.
 */
export function buildRoute(
  source: string,
  handle: (context: APIContext) => Promise<Response>,
): APIRoute {
  return async (context) => {
    try {
      return await handle(context);
    } catch (error) {
      reportFailure(source, error);
      return buildJsonResponse(500, { error: "failed" });
    }
  };
}

/** No response of these routes may be cached: each one is about this moment or this visitor. */
export function buildJsonResponse(status: number, body: object): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

/**
 * Reads a JSON body. Returns undefined for a body that is too large or is not JSON,
 * which no request schema accepts, so the use case answers "invalid".
 */
export async function readJsonBody(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length === null || !(Number(length) <= MAX_BODY_BYTES)) return undefined;

  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
