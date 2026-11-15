import {
  createFailure,
  requestCalendar,
  type GoogleCredentials,
} from "./googleCalendarRequest";

export interface GoogleCalendarConfig extends GoogleCredentials {
  /** The calendar that bookings are written to. */
  calendarId: string;
}

export interface BusyTime {
  start: Date;
  end: Date;
}

interface FreeBusyResponse {
  calendars: Record<
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

  return Object.values(response.calendars).flatMap((calendar) => {
    // Treating an unreadable calendar as free could double-book.
    if (calendar.errors) throw createFailure("list_busy_times", "unreadable");
    return (calendar.busy ?? []).map((period) => ({
      start: new Date(period.start),
      end: new Date(period.end),
    }));
  });
}

export interface NewEvent {
  start: Date;
  end: Date;
  guestEmail: string;
  title: string;
}

export interface CreatedEvent {
  id: string;
  meetUrl: string;
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
  if (!response.hangoutLink) {
    throw createFailure("create_event", "no_meet_link");
  }

  return { id: response.id, meetUrl: response.hangoutLink };
}

/** Deletes an event without emailing the guest a cancellation. */
export async function deleteEvent(
  config: GoogleCalendarConfig,
  eventId: string,
): Promise<void> {
  await requestCalendar(config, {
    operation: "delete_event",
    method: "DELETE",
    path: `${buildEventsPath(config)}/${encodeURIComponent(eventId)}?sendUpdates=none`,
  });
}

function buildEventsPath(config: GoogleCalendarConfig): string {
  return `/calendars/${encodeURIComponent(config.calendarId)}/events`;
}
