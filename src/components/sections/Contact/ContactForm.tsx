import type { ComponentChildren } from "preact";
import { useErrorBoundary, useRef, useState } from "preact/hooks";
import { OWNER_EMAIL } from "@/siteConstants";
import { BookingPanel } from "@/components/sections/Contact/ui/BookingPanel/BookingPanel";
import { hasNoSlotsToShow } from "@/components/sections/Contact/functions/bookingState";
import { useBooking } from "@/components/sections/Contact/hooks/useBooking";
import { useMessage } from "@/components/sections/Contact/hooks/useMessage";
import { CopyButton } from "@/components/sections/Contact/ui/CopyButton";
import { MessagePanel } from "@/components/sections/Contact/ui/MessagePanel/MessagePanel";
import styles from "./ContactForm.module.css";

type Mode = "booking" | "message";

/** The island of the Contact section: book a call, or send a message (ADR-0002). */
export function ContactForm() {
  const [error] = useErrorBoundary();
  if (error) return <Fallback />;

  return <ContactPanels />;
}

function ContactPanels() {
  const [mode, setMode] = useState<Mode>("booking");
  const booking = useBooking();
  const message = useMessage();
  const bookingPanel = useRef<HTMLDivElement>(null);
  const messagePanel = useRef<HTMLDivElement>(null);

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
          ref={bookingPanel}
          class={styles.panel}
          id="contact-booking"
          tabIndex={-1}
          data-width={hasNoSlotsToShow(booking.state) ? "narrow" : undefined}
          hidden={mode !== "booking"}
        >
          <BookingPanel
            state={booking.state}
            timeZone={booking.timeZone}
            fields={booking.fields}
            onReloadSlots={booking.reloadSlots}
            onChooseSlot={booking.chooseSlot}
            rejectionCount={booking.rejectionCount}
            onChangeSlot={() => {
              booking.changeSlot();
              // The button that was pressed goes away with the form.
              bookingPanel.current?.focus();
            }}
            onUpdateField={booking.updateField}
            onSubmit={booking.submit}
            onSendMessage={() => {
              setMode("message");
              focusAfterRender(() => messagePanel.current);
            }}
          />
        </div>
        <div
          class={styles.messageSide}
          id="contact-message"
          hidden={mode !== "message"}
        >
          <div
            ref={messagePanel}
            class={styles.panel}
            data-width="narrow"
            tabIndex={-1}
          >
            <MessagePanel
              state={message.state}
              fields={message.fields}
              onUpdateField={message.updateField}
              onSubmit={message.submit}
              rejectionCount={message.rejectionCount}
              onEditAgain={() => {
                message.editAgain();
                focusAfterRender(() =>
                  document.getElementById("message-email"),
                );
              }}
            />
          </div>
          {/* Stays below the form and the sent screen, as the way around a failed send (ADR-0005). */}
          <div class={styles.direct}>
            <p class={styles.directLabel}>Prefer email?</p>
            <div class={styles.directRow}>
              <span class={styles.address}>{OWNER_EMAIL}</span>
              <CopyButton text={OWNER_EMAIL} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Moves the focus to an element that the next render shows or creates. */
function focusAfterRender(findElement: () => HTMLElement | null) {
  requestAnimationFrame(() => findElement()?.focus());
}

interface ChoiceCardProps {
  title: string;
  description: string;
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
