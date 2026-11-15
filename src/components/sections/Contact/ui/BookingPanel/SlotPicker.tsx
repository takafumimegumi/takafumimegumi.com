import { useEffect, useState } from "preact/hooks";
import {
  buildDayPages,
  type OpenDay,
} from "@/components/sections/Contact/functions/slotPages";
import {
  formatDateParts,
  formatDateRange,
  formatLongDay,
  formatTime,
  formatUtcOffset,
} from "@/components/sections/Contact/functions/timeFormats";
import styles from "./SlotPicker.module.css";

// How many days fit side by side, by the width of the screen: phone, tablet, desktop.
const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1024px)";

interface Props {
  slots: string[];
  timeZone: string;
  /** A date on the page to show. Undefined shows the first page. */
  shownDate: string | undefined;
  onShowDate: (date: string) => void;
  onChooseSlot: (start: string) => void;
}

export function SlotPicker({
  slots,
  timeZone,
  shownDate,
  onShowDate,
  onChooseSlot,
}: Props) {
  const daysPerPage = useDaysPerPage();
  const [entrance, setEntrance] = useState<"appear" | "next" | "previous">(
    "appear",
  );

  const pages = buildDayPages(slots, timeZone, daysPerPage);
  // Found by date, so the same days stay in view when the list is loaded again or the screen is turned.
  const pageIndex = Math.max(
    pages.findIndex((days) => days.some((day) => day.date === shownDate)),
    0,
  );
  const page = pages[pageIndex];
  // Every page gets the height of the fullest day, so paging does not make the panel jump.
  const rows = Math.max(...pages.flat().map((day) => day.slots.length));

  return (
    <div class={styles.root}>
      <div class={styles.head}>
        <p class={styles.timeZone}>
          Times are shown in your local time (
          <b>{formatUtcOffset(slots[0], timeZone)}</b>).
        </p>
        <div class={styles.range}>
          <button
            type="button"
            class={styles.arrow}
            aria-label="Previous days"
            disabled={pageIndex === 0}
            onClick={() => {
              onShowDate(pages[pageIndex - 1][0].date);
              setEntrance("previous");
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span aria-live="polite">
            {formatDateRange(page[0].date, page[page.length - 1].date)}
          </span>
          <button
            type="button"
            class={styles.arrow}
            aria-label="Next days"
            disabled={pageIndex === pages.length - 1}
            onClick={() => {
              onShowDate(pages[pageIndex + 1][0].date);
              setEntrance("next");
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      {/* A new key makes a new element, so the entrance plays again for every page. */}
      <div
        key={page[0].date}
        class={styles.days}
        data-entrance={entrance}
        style={{ "--columns": daysPerPage, "--rows": rows }}
        role="group"
        aria-label="Open times"
      >
        {page.map((day) => (
          <DayColumn
            key={day.date}
            day={day}
            timeZone={timeZone}
            onChooseSlot={onChooseSlot}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The arrows move by as many days as are shown, so no day stays hidden between two pages.
 * This component is only drawn in the browser, after the time zone is known.
 */
function useDaysPerPage(): number {
  const [daysPerPage, setDaysPerPage] = useState(readDaysPerPage);

  useEffect(() => {
    const queries = [TABLET_QUERY, DESKTOP_QUERY].map((query) =>
      window.matchMedia(query),
    );
    const update = () => setDaysPerPage(readDaysPerPage());
    queries.forEach((query) => query.addEventListener("change", update));
    return () =>
      queries.forEach((query) => query.removeEventListener("change", update));
  }, []);

  return daysPerPage;
}

function readDaysPerPage(): number {
  if (window.matchMedia(DESKTOP_QUERY).matches) return 7;
  if (window.matchMedia(TABLET_QUERY).matches) return 4;
  return 3;
}

interface DayColumnProps {
  day: OpenDay;
  timeZone: string;
  onChooseSlot: (start: string) => void;
}

function DayColumn({ day, timeZone, onChooseSlot }: DayColumnProps) {
  const { weekday, dayOfMonth } = formatDateParts(day.date);

  return (
    <div class={styles.day}>
      <p class={styles.dayHeading}>
        <span class={styles.weekday}>{weekday}</span>
        <b class={styles.dayOfMonth}>{dayOfMonth}</b>
      </p>
      {day.slots.length === 0 && <p class={styles.noTimes}>No open times</p>}
      {day.slots.map((slot) => {
        const time = formatTime(slot, timeZone);
        return (
          <button
            key={slot}
            type="button"
            class={styles.slot}
            aria-label={`${formatLongDay(slot, timeZone)}, ${time}`}
            onClick={() => onChooseSlot(slot)}
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
