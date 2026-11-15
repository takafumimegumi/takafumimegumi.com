import styles from "./TextField.module.css";

interface Props {
  id: string;
  label: string;
  value: string;
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
    <div
      class={styles.root}
      data-invalid={error === undefined ? undefined : ""}
    >
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
