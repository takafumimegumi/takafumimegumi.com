import type { RefObject } from "preact";
import buttonStyles from "@/components/common/Button/Button.module.css";
import { Turnstile } from "./Turnstile";
import styles from "./SubmitFooter.module.css";

interface Props {
  /** Where the bot check draws itself when the visitor has to do something. */
  turnstileBoxRef: RefObject<HTMLDivElement | null>;
  /** What the visitor agrees to by pressing the button: "By booking, you agree…". */
  consentVerb: "booking" | "sending";
  label: string;
  /** Shown beside the spinner while the form is being sent. */
  busyLabel: string;
  isSubmitting: boolean;
  /** After a failure the button offers to try again. */
  hasFailed: boolean;
}

/** The end of a form: the place for the bot check, the consent line, and the button that sends. */
export function SubmitFooter({
  turnstileBoxRef,
  consentVerb,
  label,
  busyLabel,
  isSubmitting,
  hasFailed,
}: Props) {
  return (
    <>
      <Turnstile boxRef={turnstileBoxRef} />
      <p class={styles.consent}>
        By {consentVerb}, you agree to the{" "}
        <a href="/privacy/">Privacy Policy</a>.
      </p>
      <button
        type="submit"
        class={`${buttonStyles.root} ${styles.button}`}
        disabled={isSubmitting}
        data-busy={isSubmitting ? "" : undefined}
      >
        {isSubmitting ? (
          <>
            <span class={buttonStyles.spinner} aria-hidden="true" />
            {busyLabel}
          </>
        ) : hasFailed ? (
          "Try again"
        ) : (
          label
        )}
      </button>
    </>
  );
}
