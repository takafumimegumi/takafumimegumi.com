import type { ComponentChildren } from "preact";
import { useFocusOnMount } from "./useFocusOnMount";
import styles from "./ErrorNotice.module.css";

interface Props {
  children: ComponentChildren;
}

/**
 * Tells the visitor that something did not work. It takes the focus when it appears:
 * the button that was pressed is gone, or cannot be pressed for a moment.
 */
export function ErrorNotice({ children }: Props) {
  const notice = useFocusOnMount<HTMLParagraphElement>();

  return (
    <p ref={notice} class={styles.root} role="alert" tabIndex={-1}>
      {children}
    </p>
  );
}
