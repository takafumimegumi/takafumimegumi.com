import { env } from "cloudflare:workers";
import { checkRateLimit } from "@/server/clients/cloudflareRateLimit";
import { listBusyTimes } from "@/server/clients/googleCalendar";
import { parseAvailabilityRules } from "@/server/functions/parseAvailabilityRules";
import { listOpenSlots } from "@/server/usecases/listOpenSlots";
import { buildJsonResponse, buildRoute } from "./_route";

export const prerender = false;

const ROUTE = "slots";

export const GET = buildRoute(ROUTE, async ({ request }) => {
  const calendarConfig = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    calendarId: env.GOOGLE_CALENDAR_ID,
  };

  const result = await listOpenSlots(
    {
      checkRateLimit: () =>
        checkRateLimit(env.RATE_LIMITER, {
          route: ROUTE,
          visitorIp: request.headers.get("cf-connecting-ip"),
        }),
      listBusyTimes: (from, to) => listBusyTimes(calendarConfig, from, to),
    },
    parseAvailabilityRules(env.AVAILABILITY_RULES),
    new Date(),
  );

  if (result.ok) {
    return buildJsonResponse(200, {
      slots: result.slots.map((slot) => slot.toISOString()),
    });
  }
  switch (result.reason) {
    case "rate_limited":
      return buildJsonResponse(429, { error: result.reason });
  }
});
