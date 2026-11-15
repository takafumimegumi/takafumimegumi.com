import { TextField } from "./TextField";
import styles from "./NameAndEmailFields.module.css";

interface Props {
  /** Keeps the ids of the two forms apart: "booking" gives "booking-name". */
  idPrefix: "booking" | "message";
  name: string;
  email: string;
  /** The names of the fields that are not accepted. */
  invalidFields: readonly string[];
  isDisabled: boolean;
  onInput: (field: "name" | "email", value: string) => void;
}

/** The two fields that both forms start with, side by side from a tablet up. */
export function NameAndEmailFields({
  idPrefix,
  name,
  email,
  invalidFields,
  isDisabled,
  onInput,
}: Props) {
  const emailError =
    email.trim() === ""
      ? "Enter your email."
      : "Enter an email like name@example.com.";

  return (
    <div class={styles.root}>
      <TextField
        id={`${idPrefix}-name`}
        label="Name"
        value={name}
        error={invalidFields.includes("name") ? "Enter your name." : undefined}
        placeholder="Your name"
        maxLength={100}
        autocomplete="name"
        isDisabled={isDisabled}
        onInput={(value) => onInput("name", value)}
      />
      <TextField
        id={`${idPrefix}-email`}
        label="Email"
        type="email"
        value={email}
        error={invalidFields.includes("email") ? emailError : undefined}
        placeholder="you@example.com"
        maxLength={254}
        autocomplete="email"
        isDisabled={isDisabled}
        onInput={(value) => onInput("email", value)}
      />
    </div>
  );
}
