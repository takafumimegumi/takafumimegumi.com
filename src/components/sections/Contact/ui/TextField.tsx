import styles from "./TextField.module.css";

interface Props {
  /** Used as the id and the name of the input. */
  id: string;
  label: string;
  value: string;
  /** What is wrong with the value. The field is drawn as invalid when this is set. */
  error?: string;
  placeholder: string;
  /** The server's limit for this field. */
  maxLength: number;
  type?: "text" | "email";
  autocomplete?: "name" | "email";
  isOptional?: boolean;
  isMultiline?: boolean;
  isDisabled?: boolean;
  onInput: (value: string) => void;
}

/** A labelled input, with one line below it when the value is not accepted. */
export function TextField({
  id,
  label,
  value,
  error,
  placeholder,
  maxLength,
  type = "text",
  autocomplete,
  isOptional = false,
  isMultiline = false,
  isDisabled = false,
  onInput,
}: Props) {
  const errorId = `${id}-error`;
  const shared = {
    id,
    name: id,
    class: styles.input,
    value,
    placeholder,
    maxLength,
    autocomplete,
    disabled: isDisabled,
    required: !isOptional,
    "aria-invalid": error !== undefined,
    "aria-describedby": error === undefined ? undefined : errorId,
  };

  return (
    <div class={styles.root}>
      <label class={styles.label} for={id}>
        {label}
        {isOptional && <span class={styles.optional}> (optional)</span>}
      </label>
      {isMultiline ? (
        <textarea
          {...shared}
          rows={4}
          onInput={(event) => onInput(event.currentTarget.value)}
        />
      ) : type === "email" ? (
        // Written twice because the types do not accept a type that is one of two values.
        <input
          {...shared}
          type="email"
          onInput={(event) => onInput(event.currentTarget.value)}
        />
      ) : (
        <input
          {...shared}
          type="text"
          onInput={(event) => onInput(event.currentTarget.value)}
        />
      )}
      {error !== undefined && (
        <p class={styles.error} id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
