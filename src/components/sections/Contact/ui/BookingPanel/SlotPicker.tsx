import { useState } from "preact/hooks";
import symbolStyles from "@/components/common/Symbol/Symbol.module.css";
import {
  buildWeeks,
  type OpenDay,
} from "@/components/sections/Contact/functions/slotWeeks";
import {
  formatDateParts,
  formatDateRange,
  formatLongDay,
  formatTime,
  formatTimeZoneName,
} from "@/components/sections/Contact/functions/timeFormats";
import styles from "./SlotPicker.module.css";

interface Props {
  slots: string[];
  timeZone: string;
  onChooseSlot: (start: string) => void;
}

/** The open times of one week, by day, with arrows to the other weeks. */
export function SlotPicker({ slots, timeZone, onChooseSlot }: Props) {
  const [weekIndex, setWeekIndex] = useState(0);

  const weeks = buildWeeks(slots, timeZone);
  // The list can get shorter when it is loaded again.
  const week = weeks[Math.min(weekIndex, weeks.length - 1)];
  // Every week gets the height of the fullest day, so paging does not make the panel jump.
  const rows = Math.max(...weeks.flat().map((day) => day.slots.length));
  const longName = formatTimeZoneName(timeZone, "long");
  const shortName = formatTimeZoneName(timeZone, "short");

  return (
    <div class={styles.root}>
      <div class={styles.head}>
        <p class={styles.timeZone}>
          Times in your time zone:{" "}
          <b>
            {longName === shortName ? longName : `${longName} (${shortName})`}
          </b>
        </p>
        <div class={styles.week}>
          <button
            type="button"
            class={styles.arrow}
            aria-label="Previous week"
            disabled={weekIndex === 0}
            onClick={() => setWeekIndex(weekIndex - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span aria-live="polite">
            {formatDateRange(week[0].date, week[week.length - 1].date)}
          </span>
          <button
            type="button"
            class={styles.arrow}
            aria-label="Next week"
            disabled={weekIndex === weeks.length - 1}
            onClick={() => setWeekIndex(weekIndex + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div class={styles.schedule}>
        <div
          class={styles.days}
          style={{ "--rows": rows }}
          role="group"
          aria-label="Open times"
        >
          {week.map((day) => (
            <DayColumn
              key={day.date}
              day={day}
              timeZone={timeZone}
              onChooseSlot={onChooseSlot}
            />
          ))}
        </div>
        <p class={styles.swipe} aria-hidden="true">
          Swipe for more days <span class={symbolStyles.root}>→</span>
        </p>
      </div>
    </div>
  );
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
