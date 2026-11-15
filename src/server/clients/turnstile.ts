const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 10_000;

// Error codes that say the token is bad. Any other code means the call itself is broken.
const TOKEN_ERROR_CODES = [
  "missing-input-response",
  "invalid-input-response",
  "timeout-or-duplicate",
];

export interface TurnstileConfig {
  secretKey: string;
}

export interface TokenCheck {
  valid: boolean;
  /** The action the widget was rendered with, such as "booking". */
  action?: string;
  /** The hostname of the page that produced the token. */
  hostname?: string;
}

interface SiteverifyResponse {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Asks Cloudflare Turnstile whether a token is valid (ADR-0006). A token can be checked only once.
 * Throws when Turnstile rejects the call itself, such as for a wrong secret key.
 */
export async function verifyToken(
  config: TurnstileConfig,
  token: string,
  visitorIp: string | null,
): Promise<TokenCheck> {
  const body = new URLSearchParams({
    secret: config.secretKey,
    response: token,
  });
  if (visitorIp) body.set("remoteip", visitorIp);

  const response = await requestSiteverify(body);
  if (!response.ok) {
    throw createFailure("verify_token", String(response.status));
  }

  const result = await readSiteverifyResponse(response);
  const brokenCall = (result["error-codes"] ?? []).find(
    (code) => !TOKEN_ERROR_CODES.includes(code),
  );
  if (brokenCall) throw createFailure("verify_token", brokenCall);

  return {
    valid: result.success === true,
    action: result.action,
    hostname: result.hostname,
  };
}

async function requestSiteverify(body: URLSearchParams): Promise<Response> {
  try {
    return await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw createFailure("verify_token", readFetchError(error));
  }
}

async function readSiteverifyResponse(
  response: Response,
): Promise<SiteverifyResponse> {
  try {
    return (await response.json()) as SiteverifyResponse;
  } catch {
    throw createFailure("verify_token", "invalid_response");
  }
}

function readFetchError(error: unknown): string {
  return error instanceof Error && error.name === "TimeoutError"
    ? "timeout"
    : "network";
}

// The code is what gets reported, so it must never contain anything a visitor typed.
function createFailure(operation: string, detail: string): Error {
  const code = `turnstile:${operation}:${detail}`;
  return Object.assign(new Error(code), { code });
}
