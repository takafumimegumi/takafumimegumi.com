// Writes dates and times in the visitor's time zone. A start is the UTC ISO string that /api/slots returns.

const LOCALE = "en-US";
const CALL_MINUTES = 30;

/** "Mon, Nov 16" */
export function formatDay(start: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(start));
}

/** "Monday, November 16", for a screen reader. */
export function formatLongDay(start: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(start));
}

/** The two parts of a day's heading, from a local date such as "2026-11-16": "Mon" and "16". */
export function formatDateParts(date: string): {
  weekday: string;
  dayOfMonth: string;
} {
  // A date without a time parses as midnight UTC, so it is formatted in UTC.
  const midnight = new Date(date);
  return {
    weekday: new Intl.DateTimeFormat(LOCALE, {
      timeZone: "UTC",
      weekday: "short",
    }).format(midnight),
    dayOfMonth: new Intl.DateTimeFormat(LOCALE, {
      timeZone: "UTC",
      day: "numeric",
    }).format(midnight),
  };
}

/** The days of a week, from two local dates: "Nov 16 – 22", or "Nov 30 – Dec 6". */
export function formatDateRange(firstDate: string, lastDate: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).formatRange(new Date(firstDate), new Date(lastDate));
}

/** "9:30 AM" */
export function formatTime(start: string, timeZone: string): string {
  return buildTimeFormat(timeZone).format(new Date(start));
}

/** The whole call, with AM or PM written once when both ends share it: "9:30 – 10:00 AM". */
export function formatTimeRange(start: string, timeZone: string): string {
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + CALL_MINUTES * 60 * 1000);
  return buildTimeFormat(timeZone).formatRange(startDate, endDate);
}

/**
 * The distance from UTC at that time: "GMT-7". It can change with the season.
 * A zone's name or city is not shown: a device can be set to another zone with the same time.
 */
export function formatUtcOffset(start: string, timeZone: string): string {
  const offset = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(start))
    .find((part) => part.type === "timeZoneName");
  return offset ? offset.value : timeZone;
}

function buildTimeFormat(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}
