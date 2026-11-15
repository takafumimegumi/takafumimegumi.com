const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 10_000;

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
}

/** Asks Cloudflare Turnstile whether a token is valid (ADR-0006). A token can be checked only once. */
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

  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok)
    throw createFailure("verify_token", String(response.status));

  const result = (await response.json()) as SiteverifyResponse;
  return {
    valid: result.success === true,
    action: result.action,
    hostname: result.hostname,
  };
}

// The code is what gets reported, so it must never contain anything a visitor typed.
function createFailure(operation: string, detail: string): Error {
  const code = `turnstile:${operation}:${detail}`;
  return Object.assign(new Error(code), { code });
}
