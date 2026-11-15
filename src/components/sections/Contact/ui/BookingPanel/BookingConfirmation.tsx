import { CopyButton } from "@/components/sections/Contact/ui/CopyButton";
import { ChosenTimeCard } from "./ChosenTimeCard";
import styles from "./BookingConfirmation.module.css";

interface Props {
  start: string;
  email: string;
  meetUrl: string | undefined;
  timeZone: string;
  onSendMessage: () => void;
}

/** The booking stands on this screen alone, in case the invitation lands in spam. */
export function BookingConfirmation({
  start,
  email,
  meetUrl,
  timeZone,
  onSendMessage,
}: Props) {
  return (
    <div class={styles.root}>
      <div class={styles.head}>
        <span class={styles.check} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h3 class={styles.heading}>You're booked.</h3>
        <p class={styles.text}>
          I've sent a calendar invitation to <b>{email}</b>.
          <br />
          Not in your inbox? Check your spam folder.
        </p>
        <div class={styles.meet}>
          <p class={styles.meetLabel}>Google Meet link</p>
          {meetUrl ? (
            <div class={styles.meetRow}>
              <a
                class={styles.meetLink}
                href={meetUrl}
                target="_blank"
                rel="noopener"
              >
                {meetUrl.replace(/^https:\/\//, "")}
              </a>
              <CopyButton text={meetUrl} />
            </div>
          ) : (
            // Google did not return a link. The failure is reported, and I add the link by hand.
            <p>I'll email you the video call link.</p>
          )}
        </div>
      </div>
      <div class={styles.card}>
        <ChosenTimeCard start={start} timeZone={timeZone} isBooked />
      </div>
      <p class={styles.changeNote}>
        Need to change the time? Reply to the invitation, or{" "}
        <button type="button" class={styles.textButton} onClick={onSendMessage}>
          send me a message
        </button>
        .
      </p>
    </div>
  );
}
