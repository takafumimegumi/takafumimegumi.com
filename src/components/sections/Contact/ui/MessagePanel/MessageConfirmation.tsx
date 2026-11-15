import { CheckMark } from "@/components/sections/Contact/ui/CheckMark";
import { TextButton } from "@/components/sections/Contact/ui/TextButton";
import styles from "./MessageConfirmation.module.css";

interface Props {
  /** The address the visitor typed. Shown so that a slip can be noticed: no email confirms it. */
  email: string;
  onEditAgain: () => void;
}

/** Says the message was sent, and where the reply will go. */
export function MessageConfirmation({ email, onEditAgain }: Props) {
  return (
    <div class={styles.root}>
      <div class={styles.words}>
        <CheckMark />
        <h3 class={styles.heading}>Thanks, your message is on its way.</h3>
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
