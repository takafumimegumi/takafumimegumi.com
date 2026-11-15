import buttonStyles from "@/components/common/Button/Button.module.css";
import type { BookingState } from "@/components/sections/Contact/functions/bookingState";
import { EmptyState } from "./EmptyState";
import { SlotPicker } from "./SlotPicker";
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
        <EmptyState
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
        </EmptyState>
      );
    case "empty":
      return (
        <EmptyState
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
        </EmptyState>
      );
    case "choosing":
      return <SlotPicker slots={state.slots} timeZone={timeZone} />;
  }
}
