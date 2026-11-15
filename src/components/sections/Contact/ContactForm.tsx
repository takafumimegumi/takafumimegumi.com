import type { ComponentChildren } from "preact";
import { useErrorBoundary, useState } from "preact/hooks";
import { OWNER_EMAIL } from "@/siteConstants";
import styles from "./ContactForm.module.css";

type Mode = "booking" | "message";

/** The island of the Contact section: book a call, or send a message (ADR-0002). */
export function ContactForm() {
  // If the form breaks while drawing, the visitor still gets a way to reach me.
  const [error] = useErrorBoundary();
  if (error) return <Fallback />;

  return <ContactPanels />;
}

function ContactPanels() {
  const [mode, setMode] = useState<Mode>("booking");

  return (
    <>
      <div
        class={styles.choices}
        role="group"
        aria-label="How would you like to get in touch?"
        data-reveal=""
      >
        <ChoiceCard
          title="Book a call"
          description="Pick a time for a 30-minute video call."
          controls="contact-booking"
          isPressed={mode === "booking"}
          onPress={() => setMode("booking")}
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </ChoiceCard>
        <ChoiceCard
          title="Send a message"
          description="Ask me anything. I'll get back to you soon."
          controls="contact-message"
          isPressed={mode === "message"}
          onPress={() => setMode("message")}
        >
          <path d="M4 5h16v11H9l-5 4z" />
        </ChoiceCard>
      </div>

      {/* Both panels stay in the page, so switching does not lose what was typed. */}
      <div data-reveal="">
        <div
          class={styles.panel}
          id="contact-booking"
          aria-live="polite"
          hidden={mode !== "booking"}
        >
          <p class={styles.loading}>Loading open times…</p>
        </div>
        <div
          class={styles.panel}
          id="contact-message"
          aria-live="polite"
          data-width="narrow"
          hidden={mode !== "message"}
        />
      </div>
    </>
  );
}

interface ChoiceCardProps {
  title: string;
  description: string;
  /** The id of the panel this card shows. */
  controls: string;
  isPressed: boolean;
  onPress: () => void;
  /** The shapes of the icon, drawn in a 24 x 24 box. */
  children: ComponentChildren;
}

function ChoiceCard({
  title,
  description,
  controls,
  isPressed,
  onPress,
  children,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      class={styles.choice}
      aria-pressed={isPressed}
      aria-controls={controls}
      onClick={onPress}
    >
      <svg class={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
      <b class={styles.title}>{title}</b>
      <span class={styles.description}>{description}</span>
    </button>
  );
}

function Fallback() {
  return (
    <div class={styles.panel} data-width="narrow" role="alert">
      <p>
        Something went wrong with this form. Please email me at{" "}
        <b class={styles.address}>{OWNER_EMAIL}</b>.
      </p>
    </div>
  );
}
