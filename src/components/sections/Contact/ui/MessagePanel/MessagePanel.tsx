import type {
  MessageFieldName,
  MessageFields,
  MessageState,
} from "@/components/sections/Contact/functions/messageState";
import type { RequestToken } from "@/components/sections/Contact/ui/Turnstile";
import { MessageConfirmation } from "./MessageConfirmation";
import { MessageForm } from "./MessageForm";

interface Props {
  state: MessageState;
  fields: MessageFields;
  onUpdateField: (name: MessageFieldName, value: string) => void;
  onSubmit: (requestToken: RequestToken) => void;
  onEditAgain: () => void;
}

/** The message side of the contact form. Draws the state it is given. */
export function MessagePanel({
  state,
  fields,
  onUpdateField,
  onSubmit,
  onEditAgain,
}: Props) {
  if (state.status === "sent") {
    return (
      <MessageConfirmation email={state.email} onEditAgain={onEditAgain} />
    );
  }
  return (
    <MessageForm
      state={state}
      fields={fields}
      onUpdateField={onUpdateField}
      onSubmit={onSubmit}
    />
  );
}
