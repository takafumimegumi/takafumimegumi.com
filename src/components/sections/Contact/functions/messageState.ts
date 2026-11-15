import type { MessageResult } from "@/components/sections/Contact/api";
import { isEmailLike } from "./isEmailLike";

export type MessageFieldName = "name" | "email" | "text";
export type MessageFields = Record<MessageFieldName, string>;

/** Why a message was not sent, when no field is to blame. */
export type MessageFailure = "unverified" | "rate_limited" | "failed";

/** What the message panel shows. The status decides the screen. */
export type MessageState =
  | { status: "editing"; invalidFields: MessageFieldName[] }
  | { status: "submitting" }
  | { status: "failed"; reason: MessageFailure }
  | { status: "sent"; email: string };

/** Something that happened, which may move the message to another status. */
export type MessageEvent =
  | { type: "fieldEdited"; name: MessageFieldName }
  | { type: "fieldsRejected"; fields: MessageFieldName[] }
  | { type: "submitStarted" }
  | { type: "submitFinished"; result: MessageResult; email: string }
  | { type: "editRequested" };

const FIELD_NAMES: readonly string[] = ["name", "email", "text"];

export const INITIAL_MESSAGE_STATE: MessageState = {
  status: "editing",
  invalidFields: [],
};

/** Returns the next state. An event that does not fit the current status changes nothing. */
export function reduceMessageState(
  state: MessageState,
  event: MessageEvent,
): MessageState {
  switch (event.type) {
    case "fieldEdited":
      if (state.status !== "editing") return state;
      return {
        status: "editing",
        invalidFields: state.invalidFields.filter(
          (name) => name !== event.name,
        ),
      };

    case "fieldsRejected":
      if (state.status !== "editing" && state.status !== "failed") return state;
      return { status: "editing", invalidFields: event.fields };

    case "submitStarted":
      if (state.status !== "editing" && state.status !== "failed") return state;
      return { status: "submitting" };

    case "submitFinished":
      if (state.status !== "submitting") return state;
      return reduceSubmitResult(event.result, event.email);

    // The visitor saw a wrong address on the sent screen and goes back to fix it.
    case "editRequested":
      return state.status === "sent" ? INITIAL_MESSAGE_STATE : state;
  }
}

/** The fields the form can reject before asking the server. */
export function findInvalidMessageFields(
  fields: MessageFields,
): MessageFieldName[] {
  const invalidFields: MessageFieldName[] = [];
  if (fields.name.trim() === "") invalidFields.push("name");
  if (!isEmailLike(fields.email)) invalidFields.push("email");
  if (fields.text.trim() === "") invalidFields.push("text");
  return invalidFields;
}

function reduceSubmitResult(
  result: MessageResult,
  email: string,
): MessageState {
  if (result.ok) return { status: "sent", email };

  if (result.reason === "invalid") {
    // The server can also name a field the visitor does not fill in, such as the token.
    const invalidFields = result.fields.filter(isMessageFieldName);
    return invalidFields.length > 0
      ? { status: "editing", invalidFields }
      : { status: "failed", reason: "failed" };
  }
  return { status: "failed", reason: result.reason };
}

function isMessageFieldName(name: string): name is MessageFieldName {
  return FIELD_NAMES.includes(name);
}
