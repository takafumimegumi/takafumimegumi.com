import { CheckMark } from "@/components/sections/Contact/ui/CheckMark";
import { TextButton } from "@/components/sections/Contact/ui/TextButton";
import { useFocusOnMount } from "@/components/sections/Contact/ui/useFocusOnMount";
import styles from "./MessageConfirmation.module.css";

interface Props {
  /** The address the visitor typed. Shown so that a slip can be noticed: no email confirms it. */
  email: string;
  onEditAgain: () => void;
}

export function MessageConfirmation({ email, onEditAgain }: Props) {
  const heading = useFocusOnMount<HTMLHeadingElement>();

  return (
    <div class={styles.root}>
      <div class={styles.words}>
        <CheckMark />
        <h3 ref={heading} class={styles.heading} tabIndex={-1}>
          Thanks, your message is on its way.
        </h3>
        <p class={styles.text}>
          I'll reply to <b>{email}</b> soon.
        </p>
      </div>
      <p class={styles.fix}>
        Wrong address?{" "}
        <TextButton onPress={onEditAgain}>Fix it and send again</TextButton>.
      </p>
    </div>
  );
}
