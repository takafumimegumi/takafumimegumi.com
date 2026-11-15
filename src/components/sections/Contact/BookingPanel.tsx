import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import buttonStyles from "@/components/common/Button/Button.module.css";
import type { BookingState } from "./bookingState";
import {
  buildWeeks,
  formatDateParts,
  formatDateRange,
  formatLongDay,
  formatTime,
  formatTimeZoneName,
  type DayColumn,
} from "./time";
import styles from "./BookingPanel.module.css";

interface Props {
  state: BookingState;
  /** The visitor's time zone. Undefined until the page runs in the browser. */
  timeZone: string | undefined;
  onReloadSlots: () => void;
  onSendMessage: () => void;
}

/** The booking side of the contact form. Draws the state it is given. */
export function BookingPanel({
  state,
  timeZone,
  onReloadSlots,
  onSendMessage,
}: Props) {
  // Times cannot be drawn before the time zone is known.
  if (state.status === "loading" || timeZone === undefined) {
    return <p class={styles.loading}>Loading open times…</p>;
  }

  switch (state.status) {
    case "unavailable":
      return (
        <Note
          heading="Couldn't load open times."
          text="Try again, or send me a message and I'll find a time that works."
        >
          <button
            type="button"
            class={buttonStyles.root}
            onClick={onSendMessage}
          >
            Send a message
          </button>
          <button
            type="button"
            class={styles.quietButton}
            onClick={onReloadSlots}
          >
            Try again
          </button>
        </Note>
      );
    case "empty":
      return (
        <Note
          heading="No open times in the next two weeks."
          text="Send me a message, and I'll find a time that works."
        >
          <button
            type="button"
            class={buttonStyles.root}
            onClick={onSendMessage}
          >
            Send a message
          </button>
        </Note>
      );
    case "choosing":
      return <SlotList slots={state.slots} timeZone={timeZone} />;
  }
}

interface NoteProps {
  heading: string;
  text: string;
  /** The buttons. */
  children: ComponentChildren;
}

/** A short message in place of the times, with what the visitor can do next. */
function Note({ heading, text, children }: NoteProps) {
  return (
    <div class={styles.note}>
      <div class={styles.noteWords}>
        <h3 class={styles.noteHeading}>{heading}</h3>
        <p class={styles.noteText}>{text}</p>
      </div>
      <div class={styles.noteActions}>{children}</div>
    </div>
  );
}

interface SlotListProps {
  slots: string[];
  timeZone: string;
}

function SlotList({ slots, timeZone }: SlotListProps) {
  const [weekIndex, setWeekIndex] = useState(0);

  const weeks = buildWeeks(slots, timeZone);
  const week = weeks[weekIndex];
  // Every week gets the height of the fullest day, so paging does not make the panel jump.
  const rows = Math.max(...weeks.flat().map((day) => day.slots.length));
  const longName = formatTimeZoneName(timeZone, "long");
  const shortName = formatTimeZoneName(timeZone, "short");

  return (
    <div class={styles.list}>
      <div class={styles.listHead}>
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
            <Day key={day.date} day={day} timeZone={timeZone} />
          ))}
        </div>
        <p class={styles.swipe} aria-hidden="true">
          Swipe for more days →
        </p>
      </div>
    </div>
  );
}

interface DayProps {
  day: DayColumn;
  timeZone: string;
}

function Day({ day, timeZone }: DayProps) {
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
          >
            {time}
          </button>
        );
      })}
    </div>
  );
}
