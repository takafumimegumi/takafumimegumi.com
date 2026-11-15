import { useEffect, useRef } from "preact/hooks";
import type {
  MessageFailure,
  MessageFieldName,
  MessageFields,
  MessageState,
} from "@/components/sections/Contact/functions/messageState";
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
import styles from "./MessageForm.module.css";

const FAILURE_TEXT: Record<MessageFailure, string> = {
  unverified: UNVERIFIED_TEXT,
  rate_limited: RATE_LIMITED_TEXT,
  // Nothing is stored, so a failed send loses the message. My address is the way around (ADR-0005).
  failed: "Your message didn't send. Please try again, or email me directly.",
};

interface Props {
  state: Exclude<MessageState, { status: "sent" }>;
  fields: MessageFields;
  rejectionCount: number;
  onUpdateField: (name: MessageFieldName, value: string) => void;
  onSubmit: (requestToken: RequestToken) => void;
}

export function MessageForm({
  state,
  fields,
  rejectionCount,
  onUpdateField,
  onSubmit,
}: Props) {
  const turnstileBox = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (rejectionCount === 0) return;
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [rejectionCount]);

  const isSubmitting = state.status === "submitting";
  const invalidFields = state.status === "editing" ? state.invalidFields : [];

  return (
    <form
      ref={form}
      class={styles.root}
      method="post"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const box = turnstileBox.current;
        if (box) onSubmit(() => requestToken(box, "message"));
      }}
    >
      <NameAndEmailFields
        idPrefix="message"
        name={fields.name}
        email={fields.email}
        invalidFields={invalidFields}
        isDisabled={isSubmitting}
        onInput={onUpdateField}
      />
      <TextField
        id="message-text"
        label="Message"
        value={fields.text}
        error={invalidFields.includes("text") ? "Enter a message." : undefined}
        placeholder="What would you like to ask?"
        maxLength={5000}
        isMultiline
        isDisabled={isSubmitting}
        onInput={(value) => onUpdateField("text", value)}
      />
      {state.status === "failed" && (
        <ErrorNotice>{FAILURE_TEXT[state.reason]}</ErrorNotice>
      )}
      <SubmitFooter
        turnstileBoxRef={turnstileBox}
        consentVerb="sending"
        label="Send message"
        busyLabel="Sending…"
        isSubmitting={isSubmitting}
        hasFailed={state.status === "failed"}
      />
    </form>
  );
}
