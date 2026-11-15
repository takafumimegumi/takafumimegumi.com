import { buildFailure } from "../functions/buildFailure";
import type { TokenCheck } from "../types";
import { readJson, requestWithTimeout } from "./httpRequest";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const SOURCE = { service: "turnstile", operation: "verify_token" };

// Error codes that say the token is bad. Any other code means the call itself is broken.
const TOKEN_ERROR_CODES = [
  "missing-input-response",
  "invalid-input-response",
  "timeout-or-duplicate",
];

export interface TurnstileConfig {
  secretKey: string;
}

interface SiteverifyResponse {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Asks Cloudflare Turnstile whether a token is valid (ADR-0006). A token can be checked only once.
 * Throws when the call itself is broken. A wrong secret key gets HTTP 400, so its code ends in "400".
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

  const response = await requestWithTimeout(SOURCE, SITEVERIFY_URL, {
    method: "POST",
    body,
  });
  if (!response.ok) throw buildVerifyFailure(String(response.status));

  const result = await readJson<SiteverifyResponse>(SOURCE, response);
  const brokenCall = (result["error-codes"] ?? []).find(
    (code) => !TOKEN_ERROR_CODES.includes(code),
  );
  if (brokenCall) throw buildVerifyFailure(brokenCall);

  return {
    valid: result.success === true,
    action: result.action,
    hostname: result.hostname,
  };
}

function buildVerifyFailure(detail: string): Error {
  return buildFailure(SOURCE.service, SOURCE.operation, detail);
}
