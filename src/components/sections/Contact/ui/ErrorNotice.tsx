import type { ComponentChildren } from "preact";
import styles from "./ErrorNotice.module.css";

interface Props {
  children: ComponentChildren;
}

/** Tells the visitor that something did not work. A screen reader reads it as soon as it appears. */
export function ErrorNotice({ children }: Props) {
  return (
    <p class={styles.root} role="alert">
      {children}
    </p>
  );
}
