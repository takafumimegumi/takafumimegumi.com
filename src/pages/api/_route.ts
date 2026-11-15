import type { APIContext, APIRoute } from "astro";
import { reportFailure } from "@/server/clients/sentry";

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
