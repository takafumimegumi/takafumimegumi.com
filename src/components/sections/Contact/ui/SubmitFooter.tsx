import type { RefObject } from "preact";
import buttonStyles from "@/components/common/Button/Button.module.css";
import { Turnstile } from "./Turnstile";
import styles from "./SubmitFooter.module.css";

interface Props {
  turnstileBoxRef: RefObject<HTMLDivElement | null>;
  usageNotice: string;
  label: string;
  busyLabel: string;
  isSubmitting: boolean;
  hasFailed: boolean;
}

export function SubmitFooter({
  turnstileBoxRef,
  usageNotice,
  label,
  busyLabel,
  isSubmitting,
  hasFailed,
}: Props) {
  return (
    <>
      <Turnstile boxRef={turnstileBoxRef} />
      <p class={styles.notice}>
        {usageNotice} <a href="/privacy/">Privacy Policy</a>
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
