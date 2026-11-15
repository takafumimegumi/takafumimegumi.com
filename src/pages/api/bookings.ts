import { env } from "cloudflare:workers";
import { sendEmailToOwner } from "@/server/clients/cloudflareEmail";
import { checkRateLimit } from "@/server/clients/cloudflareRateLimit";
import { createEvent, listBusyTimes } from "@/server/clients/googleCalendar";
import { reportFailure } from "@/server/clients/sentry";
import { parseAvailabilityRules } from "@/server/functions/parseAvailabilityRules";
import { createBooking } from "@/server/usecases/createBooking";
import {
  buildJsonResponse,
  buildRoute,
  readCalendarConfig,
  readJsonBody,
  verifyFormToken,
} from "./_route";

export const prerender = false;

const ROUTE = "bookings";

export const POST = buildRoute(ROUTE, async ({ request }) => {
  const visitorIp = request.headers.get("cf-connecting-ip");
  const calendarConfig = readCalendarConfig();

  const result = await createBooking(
    {
      checkRateLimit: () =>
        checkRateLimit(env.RATE_LIMITER, { route: ROUTE, visitorIp }),
      verifyToken: (token) => verifyFormToken("booking", token, visitorIp),
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
