import buttonStyles from "@/components/common/Button/Button.module.css";
import type {
  BookingFieldName,
  BookingFields,
  BookingState,
} from "@/components/sections/Contact/functions/bookingState";
import { ErrorNotice } from "@/components/sections/Contact/ui/ErrorNotice";
import type { RequestToken } from "@/components/sections/Contact/ui/Turnstile";
import { BookingConfirmation } from "./BookingConfirmation";
import { BookingForm } from "./BookingForm";
import { EmptyState } from "./EmptyState";
import { SlotPicker } from "./SlotPicker";
import styles from "./BookingPanel.module.css";

interface Props {
  state: BookingState;
  /** The visitor's time zone. Undefined until the page runs in the browser. */
  timeZone: string | undefined;
  fields: BookingFields;
  onReloadSlots: () => void;
  onSendMessage: () => void;
  onChooseSlot: (start: string) => void;
  onChangeSlot: () => void;
  onUpdateField: (name: BookingFieldName, value: string) => void;
  onSubmit: (requestToken: RequestToken) => void;
}

/** The booking side of the contact form. Draws the state it is given. */
export function BookingPanel({
  state,
  timeZone,
  fields,
  onReloadSlots,
  onSendMessage,
  onChooseSlot,
  onChangeSlot,
  onUpdateField,
  onSubmit,
}: Props) {
  // Times cannot be drawn before the time zone is known.
  if (state.status === "loading" || timeZone === undefined) {
    return (
      <div class={styles.loading} role="status">
        <span
          class={`${buttonStyles.spinner} ${styles.spinner}`}
          aria-hidden="true"
        />
        <p>Loading open times…</p>
      </div>
    );
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
      return (
        <SlotPicker
          slots={state.slots}
          timeZone={timeZone}
          onChooseSlot={onChooseSlot}
        />
      );
    case "taken":
      return (
        <div class={styles.taken}>
          <ErrorNotice>
            That time is no longer available. Please pick another.
          </ErrorNotice>
          <SlotPicker
            slots={state.slots}
            timeZone={timeZone}
            onChooseSlot={onChooseSlot}
          />
        </div>
      );
    case "entering":
    case "submitting":
    case "failed":
      return (
        <BookingForm
          state={state}
          timeZone={timeZone}
          fields={fields}
          onChangeSlot={onChangeSlot}
          onUpdateField={onUpdateField}
          onSubmit={onSubmit}
        />
      );
    case "booked":
      return (
        <BookingConfirmation
          start={state.start}
          email={state.email}
          meetUrl={state.meetUrl}
          timeZone={timeZone}
          onSendMessage={onSendMessage}
        />
      );
  }
}
