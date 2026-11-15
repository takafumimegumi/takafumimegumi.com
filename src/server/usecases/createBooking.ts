import { z } from "astro/zod";
import { MINUTE_MS } from "@/siteConstants";
import type { EmailContent } from "../clients/cloudflareEmail";
import type { RateLimitCheck } from "../clients/cloudflareRateLimit";
import type { CreatedEvent, NewEvent } from "../clients/googleCalendar";
import { buildFailure } from "../functions/buildFailure";
import { computeBusyTimeRange } from "../functions/computeBusyTimeRange";
import { computeOpenSlots } from "../functions/computeOpenSlots";
import { formatVancouverTime } from "../functions/formatVancouverTime";
import { isTokenAccepted } from "../functions/isTokenAccepted";
import { readInvalidFields } from "../functions/readInvalidFields";
import type { AvailabilityRules, BusyTime, TokenCheck } from "../types";

// Where a failure that does not stop the booking is reported.
const SOURCE = "bookings";

// Fixed, so that nothing a visitor typed reaches the invitation (ADR-0006).
const EVENT_TITLE = "30-minute call with Takafumi Megumi";

const bookingRequestSchema = z.object({
  // One line only: the name goes into the sender and the subject of the email to me.
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^\P{Cc}*$/u),
  email: z.string().trim().pipe(z.email().max(254)),
  topic: z.string().trim().max(1000).optional(),
  /** The start of the chosen slot, as /api/slots returned it. */
  start: z.iso.datetime(),
  // 2048 is the longest token Turnstile issues.
  token: z.string().min(1).max(2048),
});

type BookingRequest = z.infer<typeof bookingRequestSchema>;

interface CreateBookingDependencies {
  checkRateLimit: () => Promise<RateLimitCheck>;
  verifyToken: (token: string) => Promise<TokenCheck>;
  listBusyTimes: (from: Date, to: Date) => Promise<BusyTime[]>;
  createEvent: (event: NewEvent) => Promise<CreatedEvent>;
  sendEmailToOwner: (email: EmailContent) => Promise<void>;
  reportFailure: (source: string, error: unknown) => void;
}

type CreateBookingResult =
  | { ok: true; start: Date; meetUrl?: string }
  | { ok: false; reason: "invalid"; fields: string[] }
  | { ok: false; reason: "rate_limited" | "unverified" | "taken" };

/**
 * Books a call: puts the event on my calendar with the visitor as a guest, then emails me (ADR-0005, ADR-0007).
 * Google sends the invitation, which is the visitor's confirmation.
 */
export async function createBooking(
  dependencies: CreateBookingDependencies,
  rules: AvailabilityRules,
  rawRequest: unknown,
  now: Date,
): Promise<CreateBookingResult> {
  const rateLimit = await dependencies.checkRateLimit();
  if (!rateLimit.allowed) return { ok: false, reason: "rate_limited" };

  const parsed = bookingRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    const fields = readInvalidFields(parsed.error.issues);
    return { ok: false, reason: "invalid", fields };
  }
  const request = parsed.data;

  const tokenCheck = await dependencies.verifyToken(request.token);
  if (!isTokenAccepted(tokenCheck, "booking")) {
    return { ok: false, reason: "unverified" };
  }

  // The slots are computed again, since the time may have been taken after the visitor saw it.
  const start = new Date(request.start);
  const { from, to } = computeBusyTimeRange(rules, now);
  const busyTimes = await dependencies.listBusyTimes(from, to);
  const isOpen = computeOpenSlots(rules, busyTimes, now).some(
    (slot) => slot.getTime() === start.getTime(),
  );
  if (!isOpen) return { ok: false, reason: "taken" };

  const event = await dependencies.createEvent({
    start,
    end: new Date(start.getTime() + rules.slotMinutes * MINUTE_MS),
    guestEmail: request.email,
    title: EVENT_TITLE,
  });

  // From here the booking stands. A failure is reported, and the visitor still sees success.
  if (!event.meetUrl) {
    dependencies.reportFailure(
      SOURCE,
      buildFailure("google_calendar", "create_event", "no_meet_url"),
    );
  }
  try {
    await dependencies.sendEmailToOwner(buildBookingEmail(request, start));
  } catch (error) {
    dependencies.reportFailure(SOURCE, error);
  }

  return { ok: true, start, meetUrl: event.meetUrl };
}

/** The invitation leaves out the name and the topic, so this email carries them to me. */
function buildBookingEmail(request: BookingRequest, start: Date): EmailContent {
  const time = formatVancouverTime(start);

  return {
    senderName: `${request.name} (booking)`,
    replyToAddress: request.email,
    subject: `Booking: ${time}`,
    text: [
      `When: ${time} (Vancouver)`,
      `Name: ${request.name}`,
      `Email: ${request.email}`,
      "",
      request.topic || "No topic given.",
    ].join("\n"),
  };
}
