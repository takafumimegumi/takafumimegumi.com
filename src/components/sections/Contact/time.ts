// Shows times in the visitor's time zone. A start is the UTC ISO string that /api/slots returns.

const LOCALE = "en-US";
const CALL_MINUTES = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** One day in the visitor's time zone, with the open times that start on it. */
export interface DayColumn {
  /** The local date, as "2026-11-16". */
  date: string;
  slots: string[];
}

/** Groups open times by the visitor's local date, so a far time zone sees the right day. */
export function groupSlotsByDay(
  slots: string[],
  timeZone: string,
): DayColumn[] {
  // The Canadian English date is year-month-day.
  const dateFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const days: DayColumn[] = [];
  for (const slot of [...slots].sort()) {
    const date = dateFormat.format(new Date(slot));
    const lastDay = days.at(-1);
    if (lastDay?.date === date) lastDay.slots.push(slot);
    else days.push({ date, slots: [slot] });
  }
  return days;
}

/**
 * Splits the open times into weeks of seven days in a row, starting on the first day with an open time.
 * A day without open times is kept, with no slots, so every week has the same columns.
 */
export function buildWeeks(slots: string[], timeZone: string): DayColumn[][] {
  const days = groupSlotsByDay(slots, timeZone);
  if (days.length === 0) return [];

  const daysByDate = new Map(days.map((day) => [day.date, day]));
  const firstDayMs = Date.parse(days[0].date);
  const lastDayMs = Date.parse(days[days.length - 1].date);

  const weeks: DayColumn[][] = [];
  for (let weekMs = firstDayMs; weekMs <= lastDayMs; weekMs += 7 * DAY_MS) {
    weeks.push(
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekMs + index * DAY_MS)
          .toISOString()
          .slice(0, 10);
        return daysByDate.get(date) ?? { date, slots: [] };
      }),
    );
  }
  return weeks;
}

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

/** "Pacific Time", or "PT" for the short style. */
export function formatTimeZoneName(
  timeZone: string,
  style: "long" | "short",
): string {
  const name = new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    timeZoneName: style === "long" ? "longGeneric" : "shortGeneric",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName");

  // Some zones carry a country note, such as "Pacific Time (Canada)".
  return name ? name.value.replace(/ \(.*\)$/, "") : timeZone;
}

function buildTimeFormat(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
}
