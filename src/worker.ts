import * as Sentry from "@sentry/cloudflare";
import handler from "@astrojs/cloudflare/entrypoints/server";

// Integrations that read the request, console output, and outgoing calls on their own.
const DROPPED_INTEGRATIONS = ["RequestData", "Console", "Fetch"];

// The Worker's entry: every request passes through here before it reaches Astro.
// Failures are reported by hand (src/server/clients/sentry.ts), so the SDK collects nothing itself.
export default Sentry.withSentry(
  (env: Cloudflare.Env) => ({
    // Without a DSN, as in local development, nothing is sent.
    dsn: env.SENTRY_DSN,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    // A report is a message, and its title should be that message, not a stack frame.
    attachStacktrace: false,
    integrations: (defaults) =>
      defaults.filter(({ name }) => !DROPPED_INTEGRATIONS.includes(name)),
    // A second guard, in case a later SDK version collects more by default.
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      // The visitor's time zone, taken from the request.
      delete event.contexts?.culture;
      // Otherwise Sentry records the address the event was sent from as the user.
      event.sdk = {
        ...event.sdk,
        settings: { ...event.sdk?.settings, infer_ip: "never" },
      };
      return event;
    },
  }),
  handler,
);
