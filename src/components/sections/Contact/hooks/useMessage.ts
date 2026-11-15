import { useReducer, useState } from "preact/hooks";
import {
  sendMessage,
  type MessageResult,
} from "@/components/sections/Contact/api";
import {
  findInvalidMessageFields,
  INITIAL_MESSAGE_STATE,
  reduceMessageState,
  type MessageFieldName,
  type MessageFields,
  type MessageState,
} from "@/components/sections/Contact/functions/messageState";
import { cleanName } from "@/components/sections/Contact/functions/cleanName";
import type { RequestToken } from "@/components/sections/Contact/ui/Turnstile";

export interface Message {
  state: MessageState;
  fields: MessageFields;
  /** Goes up each time fields are rejected, by the form or by the server. */
  rejectionCount: number;
  updateField: (name: MessageFieldName, value: string) => void;
  submit: (requestToken: RequestToken) => void;
  editAgain: () => void;
}

export function useMessage(): Message {
  const [state, dispatch] = useReducer(
    reduceMessageState,
    INITIAL_MESSAGE_STATE,
  );
  const [fields, setFields] = useState<MessageFields>({
    name: "",
    email: "",
    text: "",
  });

  const [rejectionCount, setRejectionCount] = useState(0);

  async function submit(requestToken: RequestToken) {
    if (state.status !== "editing" && state.status !== "failed") return;

    const invalidFields = findInvalidMessageFields(fields);
    if (invalidFields.length > 0) {
      dispatch({ type: "fieldsRejected", fields: invalidFields });
      setRejectionCount((count) => count + 1);
      return;
    }

    dispatch({ type: "submitStarted" });
    const email = fields.email.trim();
    const token = await requestToken();
    const result: MessageResult =
      token === undefined
        ? { ok: false, reason: "unverified" }
        : await sendMessage({
            name: cleanName(fields.name),
            email,
            text: fields.text.trim(),
            token,
          });
    dispatch({ type: "submitFinished", result, email });
    if (!result.ok && result.reason === "invalid") {
      setRejectionCount((count) => count + 1);
    }
  }

  return {
    state,
    fields,
    rejectionCount,
    updateField: (name, value) => {
      // From the latest values: autofill changes two fields before the next render.
      setFields((latest) => ({ ...latest, [name]: value }));
      dispatch({ type: "fieldEdited", name });
    },
    submit: (requestToken) => void submit(requestToken),
    editAgain: () => dispatch({ type: "editRequested" }),
  };
}
