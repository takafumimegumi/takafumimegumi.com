import type { RefObject } from "preact";
import buttonStyles from "@/components/common/Button/Button.module.css";
import { Turnstile } from "./Turnstile";
import styles from "./SubmitFooter.module.css";

interface Props {
  turnstileBoxRef: RefObject<HTMLDivElement | null>;
  /** What the visitor agrees to by pressing the button: "By booking, you agree…". */
  consentVerb: "booking" | "sending";
  label: string;
  busyLabel: string;
  isSubmitting: boolean;
  hasFailed: boolean;
}

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
