import { DAY_MS } from "@/siteConstants";

// Sorts open times into the days and pages of days the visitor sees. A slot is the UTC ISO string that /api/slots returns.

export interface OpenDay {
  /** The local date, as "2026-11-16". */
  date: string;
  slots: string[];
}

/** Groups open times by the visitor's local date, so a far time zone sees the right day. */
export function groupSlotsByDay(slots: string[], timeZone: string): OpenDay[] {
  // The Canadian English date is year-month-day.
  const dateFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const days: OpenDay[] = [];
  for (const slot of [...slots].sort()) {
    const date = dateFormat.format(new Date(slot));
    const lastDay = days.at(-1);
    if (lastDay?.date === date) lastDay.slots.push(slot);
    else days.push({ date, slots: [slot] });
  }
  return days;
}

/**
 * Splits the open times into pages of days in a row, starting on the first day with an open time.
 * A day without open times is kept, with no slots, so every page has the same columns.
 */
export function buildDayPages(
  slots: string[],
  timeZone: string,
  daysPerPage: number,
): OpenDay[][] {
  const days = groupSlotsByDay(slots, timeZone);
  if (days.length === 0) return [];

  const daysByDate = new Map(days.map((day) => [day.date, day]));
  const firstDayMs = Date.parse(days[0].date);
  const lastDayMs = Date.parse(days[days.length - 1].date);

  const pages: OpenDay[][] = [];
  for (
    let pageMs = firstDayMs;
    pageMs <= lastDayMs;
    pageMs += daysPerPage * DAY_MS
  ) {
    pages.push(
      Array.from({ length: daysPerPage }, (_, index) => {
        const date = new Date(pageMs + index * DAY_MS)
          .toISOString()
          .slice(0, 10);
        return daysByDate.get(date) ?? { date, slots: [] };
      }),
    );
  }
  return pages;
}
