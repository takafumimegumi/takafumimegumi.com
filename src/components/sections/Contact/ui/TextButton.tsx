import type { ComponentChildren } from "preact";
import styles from "./TextButton.module.css";

interface Props {
  onPress: () => void;
  children: ComponentChildren;
}

/** A button that reads as a link inside a sentence. It acts on the page instead of leaving it. */
export function TextButton({ onPress, children }: Props) {
  return (
    <button type="button" class={styles.root} onClick={onPress}>
      {children}
    </button>
  );
}
