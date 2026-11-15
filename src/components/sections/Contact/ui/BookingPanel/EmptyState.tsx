import type { ComponentChildren } from "preact";
import styles from "./EmptyState.module.css";

interface Props {
  heading: string;
  text: string;
  /** The buttons. */
  children: ComponentChildren;
}

/** A short message in place of the open times, with what the visitor can do next. */
export function EmptyState({ heading, text, children }: Props) {
  return (
    <div class={styles.root}>
      <div class={styles.words}>
        <h3 class={styles.heading}>{heading}</h3>
        <p class={styles.text}>{text}</p>
      </div>
      <div class={styles.actions}>{children}</div>
    </div>
  );
}
