// The only file of the form that calls the server. No function here throws:
// a failed connection or an answer it cannot read comes back as "failed".

export type SlotsResult =
  | { ok: true; slots: string[] }
  | { ok: false; reason: "rate_limited" | "failed" };

export interface BookingRequest {
  name: string;
  email: string;
  topic?: string;
  /** The start of the chosen time, as /api/slots returned it. */
  start: string;
  token: string;
}

export type BookingResult =
  | { ok: true; start: string; meetUrl?: string }
  | { ok: false; reason: "invalid"; fields: string[] }
  | { ok: false; reason: "unverified" | "taken" | "rate_limited" | "failed" };

export interface MessageRequest {
  name: string;
  email: string;
  text: string;
  token: string;
}

export type MessageResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; fields: string[] }
  | { ok: false; reason: "unverified" | "rate_limited" | "failed" };

// Longer than the server's worst case, about 40 seconds for a booking,
// so the screen does not give up on a booking that is about to succeed.
const TIMEOUT_MS = 45_000;

const FAILED = { ok: false, reason: "failed" } as const;

export async function listOpenSlots(): Promise<SlotsResult> {
  const response = await sendRequest("/api/slots");

  switch (response?.status) {
    case 200: {
      const body = await readBody(response);
      return isStringArray(body.slots)
        ? { ok: true, slots: body.slots }
        : FAILED;
    }
    case 429:
      return { ok: false, reason: "rate_limited" };
    default:
      return FAILED;
  }
}

export async function createBooking(
  request: BookingRequest,
): Promise<BookingResult> {
  const response = await sendRequest("/api/bookings", request);

  switch (response?.status) {
    case 201: {
      const body = await readBody(response);
      if (typeof body.start !== "string") return FAILED;
      return {
        ok: true,
        start: body.start,
        meetUrl: typeof body.meetUrl === "string" ? body.meetUrl : undefined,
      };
    }
    case 400:
      return readInvalidResult(response);
    case 403:
      return { ok: false, reason: "unverified" };
    case 409:
      return { ok: false, reason: "taken" };
    case 429:
      return { ok: false, reason: "rate_limited" };
    default:
      return FAILED;
  }
}

export async function sendMessage(
  request: MessageRequest,
): Promise<MessageResult> {
  const response = await sendRequest("/api/messages", request);

  switch (response?.status) {
    case 200:
      return { ok: true };
    case 400:
      return readInvalidResult(response);
    case 403:
      return { ok: false, reason: "unverified" };
    case 429:
      return { ok: false, reason: "rate_limited" };
    default:
      return FAILED;
  }
}

/** Returns undefined when the server cannot be reached in time. */
async function sendRequest(
  path: string,
  body?: object,
): Promise<Response | undefined> {
  try {
    return await fetch(path, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(body && {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  } catch {
    return undefined;
  }
}

/** Reads a JSON object. Anything else, such as an HTML error page, reads as an empty object. */
async function readBody(response: Response): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/** A 400 names the fields that did not pass. It names none when the body could not be read. */
async function readInvalidResult(
  response: Response,
): Promise<{ ok: false; reason: "invalid"; fields: string[] }> {
  const { fields } = await readBody(response);
  return {
    ok: false,
    reason: "invalid",
    fields: isStringArray(fields) ? fields : [],
  };
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
