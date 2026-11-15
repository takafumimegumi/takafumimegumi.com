// Sorts open times into the days and weeks the visitor sees. A slot is the UTC ISO string that /api/slots returns.

const DAY_MS = 24 * 60 * 60 * 1000;

/** One day in the visitor's time zone, with the open times that start on it. */
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
 * Splits the open times into weeks of seven days in a row, starting on the first day with an open time.
 * A day without open times is kept, with no slots, so every week has the same columns.
 */
export function buildWeeks(slots: string[], timeZone: string): OpenDay[][] {
  const days = groupSlotsByDay(slots, timeZone);
  if (days.length === 0) return [];

  const daysByDate = new Map(days.map((day) => [day.date, day]));
  const firstDayMs = Date.parse(days[0].date);
  const lastDayMs = Date.parse(days[days.length - 1].date);

  const weeks: OpenDay[][] = [];
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
