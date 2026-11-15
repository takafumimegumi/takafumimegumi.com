import { env } from "cloudflare:workers";
import { sendEmailToOwner } from "@/server/clients/cloudflareEmail";
import { checkRateLimit } from "@/server/clients/cloudflareRateLimit";
import { sendMessage } from "@/server/usecases/sendMessage";
import {
  buildJsonResponse,
  buildRoute,
  readJsonBody,
  verifyFormToken,
} from "./_route";

export const prerender = false;

const ROUTE = "messages";

export const POST = buildRoute(ROUTE, async ({ request }) => {
  const visitorIp = request.headers.get("cf-connecting-ip");

  const result = await sendMessage(
    {
      checkRateLimit: () =>
        checkRateLimit(env.RATE_LIMITER, { route: ROUTE, visitorIp }),
      verifyToken: (token) => verifyFormToken("message", token, visitorIp),
      sendEmailToOwner: (email) => sendEmailToOwner(env.EMAIL, email),
    },
    await readJsonBody(request),
  );

  if (result.ok) return buildJsonResponse(200, {});
  switch (result.reason) {
    case "invalid":
      return buildJsonResponse(400, {
        error: result.reason,
        fields: result.fields,
      });
    case "unverified":
      return buildJsonResponse(403, { error: result.reason });
    case "rate_limited":
      return buildJsonResponse(429, { error: result.reason });
  }
});
