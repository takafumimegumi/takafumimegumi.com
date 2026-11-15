import { useState } from "preact/hooks";
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

const TAKEN_TEXT = "That time is no longer available. Please pick another.";
// The earlier try may be what took the time. Booking another would make two calls (ADR-0007).
const TAKEN_AFTER_NO_ANSWER_TEXT =
  "That time is now taken, possibly by your first try. If an invitation arrives in your inbox, your call is booked and you don't need to book again. If not, please pick another time.";

interface Props {
  state: BookingState;
  timeZone: string | undefined;
  fields: BookingFields;
  rejectionCount: number;
  onReloadSlots: () => void;
  onSendMessage: () => void;
  onChooseSlot: (start: string) => void;
  onChangeSlot: () => void;
  onUpdateField: (name: BookingFieldName, value: string) => void;
  onSubmit: (requestToken: RequestToken) => void;
}

export function BookingPanel({
  state,
  timeZone,
  fields,
  rejectionCount,
  onReloadSlots,
  onSendMessage,
  onChooseSlot,
  onChangeSlot,
  onUpdateField,
  onSubmit,
}: Props) {
  const [shownDate, setShownDate] = useState<string>();
  const { slots, step } = state;

  // Times cannot be drawn before the time zone is known.
  if (timeZone === undefined || slots.status === "loading") {
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

  switch (step.status) {
    case "booked":
      return (
        <BookingConfirmation
          start={step.start}
          email={step.email}
          meetUrl={step.meetUrl}
          timeZone={timeZone}
          onSendMessage={onSendMessage}
        />
      );
    case "entering":
    case "submitting":
    case "failed":
      return (
        <BookingForm
          state={step}
          timeZone={timeZone}
          fields={fields}
          rejectionCount={rejectionCount}
          onChangeSlot={onChangeSlot}
          onUpdateField={onUpdateField}
          onSubmit={onSubmit}
        />
      );
  }

  if (slots.status === "unavailable") {
    return (
      <EmptyState
        heading="Couldn't load open times."
        text="Try again, or send me a message and I'll find a time that works."
      >
        <button type="button" class={buttonStyles.root} onClick={onSendMessage}>
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
  }

  return (
    <div class={styles.choosing}>
      {step.status === "taken" && (
        <ErrorNotice>
          {step.mayBeBooked ? TAKEN_AFTER_NO_ANSWER_TEXT : TAKEN_TEXT}
        </ErrorNotice>
      )}
      {slots.slots.length === 0 ? (
        <EmptyState
          heading="No open times right now."
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
      ) : (
        <SlotPicker
          slots={slots.slots}
          timeZone={timeZone}
          shownDate={shownDate}
          onShowDate={setShownDate}
          onChooseSlot={onChooseSlot}
        />
      )}
    </div>
  );
}
