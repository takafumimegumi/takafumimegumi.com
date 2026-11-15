import styles from "./CheckMark.module.css";

/** The round mark at the top of a screen that says something was done. */
export function CheckMark() {
  return (
    <span class={styles.root} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
