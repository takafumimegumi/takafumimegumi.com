import {
  formatDay,
  formatTimeRange,
  formatTimeZoneName,
} from "@/components/sections/Contact/functions/timeFormats";
import styles from "./ChosenTimeCard.module.css";

interface Props {
  /** The start of the call, as /api/slots returned it. */
  start: string;
  timeZone: string;
  /** After the booking is made, the card turns deep green. The meeting link is shown beside it. */
  isBooked?: boolean;
}

/** The chosen time of the call, in the visitor's time zone. */
export function ChosenTimeCard({ start, timeZone, isBooked = false }: Props) {
  return (
    <div class={styles.root} data-ground={isBooked ? "deep" : undefined}>
      <div class={styles.when}>
        <p class={styles.label}>Your time</p>
        <p class={styles.day}>{formatDay(start, timeZone)}</p>
        <p class={styles.time}>
          {formatTimeRange(start, timeZone)}{" "}
          <span class={styles.zone}>
            {formatTimeZoneName(timeZone, "short")}
          </span>
        </p>
      </div>
      <ul class={styles.details}>
        <li class={styles.detail}>
          <svg class={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="6" width="13" height="12" rx="2" />
            <path d="M16 10.5l5-3v9l-5-3" />
          </svg>
          30-minute video call
        </li>
        {!isBooked && (
          <li class={styles.detail}>
            <svg class={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
            </svg>
            Google Meet link included
          </li>
        )}
      </ul>
    </div>
  );
}
