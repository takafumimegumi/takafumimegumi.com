import { env } from "cloudflare:workers";
import { sendEmailToOwner } from "@/server/clients/cloudflareEmail";
import { checkRateLimit } from "@/server/clients/cloudflareRateLimit";
import { createEvent, listBusyTimes } from "@/server/clients/googleCalendar";
import { reportFailure } from "@/server/clients/sentry";
import { verifyToken } from "@/server/clients/turnstile";
import { parseAvailabilityRules } from "@/server/functions/parseAvailabilityRules";
import { createBooking } from "@/server/usecases/createBooking";
import { buildJsonResponse, buildRoute, readJsonBody } from "./_route";

export const prerender = false;

const ROUTE = "bookings";

export const POST = buildRoute(ROUTE, async ({ request }) => {
  const visitorIp = request.headers.get("cf-connecting-ip");
  const calendarConfig = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    calendarId: env.GOOGLE_CALENDAR_ID,
  };

  const result = await createBooking(
    {
      checkRateLimit: () =>
        checkRateLimit(env.RATE_LIMITER, { route: ROUTE, visitorIp }),
      verifyToken: async (token) => {
        const check = await verifyToken(
          { secretKey: env.TURNSTILE_SECRET_KEY },
          token,
          visitorIp,
        );
        // Turnstile's test keys answer "example.com" and no action, so local runs fill them in.
        return import.meta.env.DEV && check.valid
          ? { valid: true, action: "booking", hostname: "takafumimegumi.com" }
          : check;
      },
      listBusyTimes: (from, to) => listBusyTimes(calendarConfig, from, to),
      createEvent: (event) => createEvent(calendarConfig, event),
      sendEmailToOwner: (email) => sendEmailToOwner(env.EMAIL, email),
      reportFailure,
    },
    parseAvailabilityRules(env.AVAILABILITY_RULES),
    await readJsonBody(request),
    new Date(),
  );

  if (result.ok) {
    return buildJsonResponse(201, {
      start: result.start.toISOString(),
      meetUrl: result.meetUrl,
    });
  }
  switch (result.reason) {
    case "invalid":
      return buildJsonResponse(400, {
        error: result.reason,
        fields: result.fields,
      });
    case "unverified":
      return buildJsonResponse(403, { error: result.reason });
    case "taken":
      return buildJsonResponse(409, { error: result.reason });
    case "rate_limited":
      return buildJsonResponse(429, { error: result.reason });
  }
});
