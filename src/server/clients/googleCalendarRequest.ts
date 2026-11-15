// How googleCalendar.ts talks to Google: an access token, an authorized call, and failure codes.
// Plain fetch, with no Google SDK (ADR-0007).
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_URL = "https://www.googleapis.com/calendar/v3";
const TIMEOUT_MS = 10_000;

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface CalendarRequest {
  /** Names the caller in the failure code, such as "create_event". */
  operation: string;
  method: string;
  path: string;
  body?: unknown;
}

/** Calls the Calendar API as me. Throws with the HTTP status when Google refuses. */
export async function requestCalendar<Body = void>(
  credentials: GoogleCredentials,
  request: CalendarRequest,
): Promise<Body> {
  const response = await fetch(API_URL + request.path, {
    method: request.method,
    headers: {
      authorization: `Bearer ${await requestAccessToken(credentials)}`,
      "content-type": "application/json",
    },
    body: request.body ? JSON.stringify(request.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // The status only. A Google error body can echo the guest's address.
  if (!response.ok) {
    throw createFailure(request.operation, String(response.status));
  }

  return (response.status === 204 ? undefined : await response.json()) as Body;
}

/** The code is what gets reported, so it must never contain anything a visitor typed. */
export function createFailure(operation: string, detail = "unknown"): Error {
  const code = `google_calendar:${operation}:${detail}`;
  return Object.assign(new Error(code), { code });
}

interface TokenResponse {
  access_token?: string;
  error?: string;
}

async function requestAccessToken(
  credentials: GoogleCredentials,
): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await response.json()) as TokenResponse;
  // Google names the reason in `error`, such as "invalid_grant" for a refresh token it rejects.
  if (!body.access_token) {
    throw createFailure("request_access_token", body.error);
  }

  return body.access_token;
}
