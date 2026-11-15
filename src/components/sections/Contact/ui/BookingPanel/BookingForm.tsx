import { useRef } from "preact/hooks";
import symbolStyles from "@/components/common/Symbol/Symbol.module.css";
import type {
  BookingFailure,
  BookingFieldName,
  BookingFields,
  BookingState,
} from "@/components/sections/Contact/functions/bookingState";
import { ErrorNotice } from "@/components/sections/Contact/ui/ErrorNotice";
import {
  RATE_LIMITED_TEXT,
  UNVERIFIED_TEXT,
} from "@/components/sections/Contact/ui/failureTexts";
import { NameAndEmailFields } from "@/components/sections/Contact/ui/NameAndEmailFields";
import { SubmitFooter } from "@/components/sections/Contact/ui/SubmitFooter";
import { TextField } from "@/components/sections/Contact/ui/TextField";
import {
  requestToken,
  type RequestToken,
} from "@/components/sections/Contact/ui/Turnstile";
import { ChosenTimeCard } from "./ChosenTimeCard";
import styles from "./BookingForm.module.css";

// What the visitor reads when a booking fails for a reason no field explains.
const FAILURE_TEXT: Record<BookingFailure, string> = {
  unverified: UNVERIFIED_TEXT,
  rate_limited: RATE_LIMITED_TEXT,
  // A slow answer can hide a booking that was made (ADR-0007).
  failed:
    "I couldn't confirm your booking. If an invitation arrives in your inbox, your call is booked. If not, please try again or send me a message.",
};

interface Props {
  state: Extract<
    BookingState,
    { status: "entering" | "submitting" | "failed" }
  >;
  timeZone: string;
  fields: BookingFields;
  onChangeSlot: () => void;
  onUpdateField: (name: BookingFieldName, value: string) => void;
  onSubmit: (requestToken: RequestToken) => void;
}

/** The chosen time on one side, and the form for the visitor's details on the other. */
export function BookingForm({
  state,
  timeZone,
  fields,
  onChangeSlot,
  onUpdateField,
  onSubmit,
}: Props) {
  const turnstileBox = useRef<HTMLDivElement>(null);

  const isSubmitting = state.status === "submitting";
  const invalidFields = state.status === "entering" ? state.invalidFields : [];

  return (
    <div class={styles.root}>
      <div class={styles.chosen}>
        <button
          type="button"
          class={styles.back}
          disabled={isSubmitting}
          onClick={onChangeSlot}
        >
          <span class={symbolStyles.root}>←</span> Change time
        </button>
        <ChosenTimeCard start={state.start} timeZone={timeZone} />
      </div>
      <form
        class={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const box = turnstileBox.current;
          if (box) onSubmit(() => requestToken(box, "booking"));
        }}
      >
        <NameAndEmailFields
          idPrefix="booking"
          name={fields.name}
          email={fields.email}
          invalidFields={invalidFields}
          isDisabled={isSubmitting}
          onInput={onUpdateField}
        />
        <TextField
          id="booking-topic"
          label="What would you like to talk about?"
          value={fields.topic}
          error={
            invalidFields.includes("topic")
              ? "Keep this under 1,000 characters."
              : undefined
          }
          placeholder="e.g. a role you're hiring for, or a question about my work"
          maxLength={1000}
          isOptional
          isMultiline
          isDisabled={isSubmitting}
          onInput={(value) => onUpdateField("topic", value)}
        />
        {state.status === "failed" && (
          <ErrorNotice>{FAILURE_TEXT[state.reason]}</ErrorNotice>
        )}
        <SubmitFooter
          turnstileBoxRef={turnstileBox}
          consentVerb="booking"
          label="Confirm booking"
          busyLabel="Booking…"
          isSubmitting={isSubmitting}
          hasFailed={state.status === "failed"}
        />
      </form>
    </div>
  );
}
