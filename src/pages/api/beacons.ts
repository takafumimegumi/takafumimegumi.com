import { env } from "cloudflare:workers";
import { createBeaconPoint } from "@/server/clients/cloudflareAnalyticsEngine";
import { createBeacon } from "@/server/usecases/createBeacon";
import { buildJsonResponse, buildRoute, readJsonBody } from "./_route";

export const prerender = false;

const ROUTE = "beacons";

export const POST = buildRoute(ROUTE, async ({ request }) => {
  const result = createBeacon(
    { createBeaconPoint: (point) => createBeaconPoint(env.BEACONS, point) },
    await readJsonBody(request),
    new URL(request.url).hostname,
  );

  if (result.ok) return buildJsonResponse(200, {});
  switch (result.reason) {
    case "invalid":
      return buildJsonResponse(400, { error: result.reason });
  }
});
