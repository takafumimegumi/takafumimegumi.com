import type { BusyTime } from "../types";
import {
  buildCalendarFailure,
  requestCalendar,
  type GoogleCredentials,
} from "./googleCalendarRequest";

export interface GoogleCalendarConfig extends GoogleCredentials {
  /** The calendar that bookings are written to. */
  calendarId: string;
}

interface FreeBusyResponse {
  calendars?: Record<
    string,
    { busy?: { start: string; end: string }[]; errors?: unknown[] }
  >;
}

/** Busy time on my own calendar and on the booking calendar. */
export async function listBusyTimes(
  config: GoogleCalendarConfig,
  from: Date,
  to: Date,
): Promise<BusyTime[]> {
  const calendarIds = [...new Set(["primary", config.calendarId])];
  const response = await requestCalendar<FreeBusyResponse>(config, {
    operation: "list_busy_times",
    method: "POST",
    path: "/freeBusy",
    body: {
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      items: calendarIds.map((id) => ({ id })),
    },
  });

  // A calendar that is missing or unreadable must not count as free: that could double-book.
  const calendars = Object.values(response.calendars ?? {});
  const unreadable =
    calendars.length !== calendarIds.length ||
    calendars.some((calendar) => calendar.errors);
  if (unreadable) throw buildCalendarFailure("list_busy_times", "unreadable");

  return calendars.flatMap((calendar) =>
    (calendar.busy ?? []).map((period) => ({
      start: new Date(period.start),
      end: new Date(period.end),
    })),
  );
}

export interface NewEvent {
  start: Date;
  end: Date;
  guestEmail: string;
  title: string;
}

export interface CreatedEvent {
  id: string;
  /** Missing when Google has not made the link yet. The invitation carries it later. */
  meetUrl?: string;
}

interface EventResponse {
  id: string;
  hangoutLink?: string;
}

/** Creates the event with a Meet link. Google emails the invitation to the guest. */
export async function createEvent(
  config: GoogleCalendarConfig,
  event: NewEvent,
): Promise<CreatedEvent> {
  const response = await requestCalendar<EventResponse>(config, {
    operation: "create_event",
    method: "POST",
    path: `${buildEventsPath(config)}?conferenceDataVersion=1&sendUpdates=all`,
    body: {
      summary: event.title,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
      attendees: [{ email: event.guestEmail }],
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });
  return { id: response.id, meetUrl: response.hangoutLink };
}

function buildEventsPath(config: GoogleCalendarConfig): string {
  return `/calendars/${encodeURIComponent(config.calendarId)}/events`;
}
