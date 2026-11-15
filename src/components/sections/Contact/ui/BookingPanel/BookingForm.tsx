import { useRef } from "preact/hooks";
import buttonStyles from "@/components/common/Button/Button.module.css";
import symbolStyles from "@/components/common/Symbol/Symbol.module.css";
import type {
  BookingFailure,
  BookingFieldName,
  BookingFields,
  BookingState,
} from "@/components/sections/Contact/functions/bookingState";
import { ErrorNotice } from "@/components/sections/Contact/ui/ErrorNotice";
import { TextField } from "@/components/sections/Contact/ui/TextField";
import {
  requestToken,
  Turnstile,
  type RequestToken,
} from "@/components/sections/Contact/ui/Turnstile";
import { ChosenTimeCard } from "./ChosenTimeCard";
import styles from "./BookingForm.module.css";

// What the visitor reads when a booking fails for a reason no field explains.
const FAILURE_TEXT: Record<BookingFailure, string> = {
  unverified: "The security check didn't pass. Please try again.",
  rate_limited: "Too many attempts. Please wait a minute and try again.",
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
  const emailError =
    fields.email.trim() === ""
      ? "Enter your email."
      : "Enter an email like name@example.com.";

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
        <div class={styles.pair}>
          <TextField
            id="booking-name"
            label="Name"
            value={fields.name}
            error={
              invalidFields.includes("name") ? "Enter your name." : undefined
            }
            placeholder="Your name"
            maxLength={100}
            autocomplete="name"
            isDisabled={isSubmitting}
            onInput={(value) => onUpdateField("name", value)}
          />
          <TextField
            id="booking-email"
            label="Email"
            type="email"
            value={fields.email}
            error={invalidFields.includes("email") ? emailError : undefined}
            placeholder="you@example.com"
            maxLength={254}
            autocomplete="email"
            isDisabled={isSubmitting}
            onInput={(value) => onUpdateField("email", value)}
          />
        </div>
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
        <Turnstile boxRef={turnstileBox} />
        <p class={styles.consent}>
          By booking, you agree to the <a href="/privacy/">Privacy Policy</a>.
        </p>
        <button
          type="submit"
          class={`${buttonStyles.root} ${styles.submit}`}
          disabled={isSubmitting}
          data-busy={isSubmitting ? "" : undefined}
        >
          {isSubmitting ? (
            <>
              <span class={buttonStyles.spinner} aria-hidden="true" />
              Booking…
            </>
          ) : state.status === "failed" ? (
            "Try again"
          ) : (
            "Confirm booking"
          )}
        </button>
      </form>
    </div>
  );
}
