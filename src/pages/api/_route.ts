import type { APIContext, APIRoute } from "astro";
import { reportFailure } from "@/server/clients/sentry";

// The largest valid form is about 18 KB: a message of 5,000 characters can take 15 KB in UTF-8.
const MAX_BODY_BYTES = 32 * 1024;

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
  if (!request.body) return undefined;

  // Counted while reading, since a Content-Length header can be missing.
  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }

  try {
    return JSON.parse(await new Blob(chunks).text());
  } catch {
    return undefined;
  }
}
