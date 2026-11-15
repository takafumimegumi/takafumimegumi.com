import { buildFailure } from "../functions/failureCode";
import { readJson, requestWithTimeout } from "./httpRequest";

// How googleCalendar.ts talks to Google: an access token, an authorized call, and failure codes.
// Plain fetch, with no Google SDK (ADR-0007).
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API_URL = "https://www.googleapis.com/calendar/v3";
const SERVICE = "google_calendar";

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
  const source = { service: SERVICE, operation: request.operation };
  const accessToken = await requestAccessToken(credentials);
  const response = await requestWithTimeout(source, API_URL + request.path, {
    method: request.method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: request.body ? JSON.stringify(request.body) : undefined,
  });
  // The status only. A Google error body can echo the guest's address.
  if (!response.ok) {
    throw buildCalendarFailure(request.operation, String(response.status));
  }
  if (response.status === 204) return undefined as Body;

  return readJson<Body>(source, response);
}

export function buildCalendarFailure(operation: string, detail: string): Error {
  return buildFailure(SERVICE, operation, detail);
}

interface TokenResponse {
  access_token?: string;
  error?: string;
}

async function requestAccessToken(
  credentials: GoogleCredentials,
): Promise<string> {
  const source = { service: SERVICE, operation: "request_access_token" };
  const response = await requestWithTimeout(source, TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await readJson<TokenResponse>(source, response);
  if (!body.access_token) {
    // Google names the reason, such as "invalid_grant". Anything else becomes the status.
    const reason = /^[a-z_]{1,40}$/.test(body.error ?? "")
      ? body.error
      : undefined;
    throw buildCalendarFailure(
      source.operation,
      reason ?? String(response.status),
    );
  }

  return body.access_token;
}
