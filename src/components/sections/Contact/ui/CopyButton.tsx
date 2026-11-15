import { useEffect, useRef, useState } from "preact/hooks";
import symbolStyles from "@/components/common/Symbol/Symbol.module.css";
import styles from "./CopyButton.module.css";

const COPIED_MS = 2000;

interface Props {
  text: string;
}

export function CopyButton({ text }: Props) {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Refused, for example in an in-app browser. The text stays on screen to select by hand.
      return;
    }
    setIsCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setIsCopied(false), COPIED_MS);
  }

  return (
    <button
      type="button"
      class={styles.root}
      aria-live="polite"
      onClick={() => void copy()}
    >
      {isCopied ? (
        <>
          Copied <span class={symbolStyles.root}>✓</span>
        </>
      ) : (
        "Copy"
      )}
    </button>
  );
}
