import type { BookingResult } from "@/components/sections/Contact/api";
import { isEmailLike } from "./isEmailLike";

export type BookingFieldName = "name" | "email" | "topic";
export type BookingFields = Record<BookingFieldName, string>;

/** Why a booking did not go through, when no field is to blame. */
export type BookingFailure = "unverified" | "rate_limited" | "failed";

/** What the booking panel shows. The status decides the screen. */
export type BookingState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "empty" }
  | { status: "choosing"; slots: string[] }
  /** The chosen time could not be booked, so the visitor picks another. */
  | { status: "taken"; slots: string[] }
  | {
      status: "entering";
      slots: string[];
      start: string;
      invalidFields: BookingFieldName[];
    }
  | { status: "submitting"; slots: string[]; start: string }
  | {
      status: "failed";
      slots: string[];
      start: string;
      reason: BookingFailure;
    }
  | { status: "booked"; start: string; email: string; meetUrl?: string };

/** Something that happened, which may move the booking to another status. */
export type BookingEvent =
  | { type: "slotsRequested" }
  | { type: "slotsLoaded"; slots: string[] }
  | { type: "slotsFailed" }
  | { type: "slotChosen"; start: string }
  | { type: "slotChangeRequested" }
  | { type: "fieldEdited"; name: BookingFieldName }
  | { type: "fieldsRejected"; fields: BookingFieldName[] }
  | { type: "submitStarted" }
  | { type: "submitFinished"; result: BookingResult; email: string };

const FIELD_NAMES: readonly string[] = ["name", "email", "topic"];

// The page is built in this status, before any open time is known.
export const INITIAL_BOOKING_STATE: BookingState = { status: "loading" };

/** Returns the next state. An event that does not fit the current status changes nothing. */
export function reduceBookingState(
  state: BookingState,
  event: BookingEvent,
): BookingState {
  switch (event.type) {
    case "slotsRequested":
      return state.status === "unavailable" ? { status: "loading" } : state;

    case "slotsLoaded":
      // After a time was taken, the list is loaded again and replaces the old one.
      if (state.status !== "loading" && state.status !== "taken") return state;
      if (event.slots.length === 0) return { status: "empty" };
      return state.status === "taken"
        ? { status: "taken", slots: event.slots }
        : { status: "choosing", slots: event.slots };

    case "slotsFailed":
      return state.status === "loading" ? { status: "unavailable" } : state;

    case "slotChosen":
      if (state.status !== "choosing" && state.status !== "taken") return state;
      return {
        status: "entering",
        slots: state.slots,
        start: event.start,
        invalidFields: [],
      };

    case "slotChangeRequested":
      if (state.status !== "entering" && state.status !== "failed")
        return state;
      return { status: "choosing", slots: state.slots };

    case "fieldEdited":
      if (state.status !== "entering") return state;
      return {
        ...state,
        invalidFields: state.invalidFields.filter(
          (name) => name !== event.name,
        ),
      };

    case "fieldsRejected":
      if (state.status !== "entering" && state.status !== "failed")
        return state;
      return {
        status: "entering",
        slots: state.slots,
        start: state.start,
        invalidFields: event.fields,
      };

    case "submitStarted":
      if (state.status !== "entering" && state.status !== "failed")
        return state;
      return { status: "submitting", slots: state.slots, start: state.start };

    case "submitFinished":
      if (state.status !== "submitting") return state;
      return reduceSubmitResult(state, event.result, event.email);
  }
}

/** The fields the form can reject before asking the server: an empty name, and an email that is not shaped like one. */
export function findInvalidBookingFields(
  fields: BookingFields,
): BookingFieldName[] {
  const invalidFields: BookingFieldName[] = [];
  if (fields.name.trim() === "") invalidFields.push("name");
  if (!isEmailLike(fields.email)) invalidFields.push("email");
  return invalidFields;
}

function reduceSubmitResult(
  { slots, start }: { slots: string[]; start: string },
  result: BookingResult,
  email: string,
): BookingState {
  if (result.ok) {
    return {
      status: "booked",
      start: result.start,
      email,
      meetUrl: result.meetUrl,
    };
  }

  switch (result.reason) {
    case "invalid": {
      // The server can also name a field the visitor does not fill in, such as the token.
      const invalidFields = result.fields.filter(isBookingFieldName);
      return invalidFields.length > 0
        ? { status: "entering", slots, start, invalidFields }
        : { status: "failed", slots, start, reason: "failed" };
    }
    case "taken": {
      const openSlots = slots.filter((slot) => slot !== start);
      return openSlots.length > 0
        ? { status: "taken", slots: openSlots }
        : { status: "empty" };
    }
    default:
      return { status: "failed", slots, start, reason: result.reason };
  }
}

function isBookingFieldName(name: string): name is BookingFieldName {
  return FIELD_NAMES.includes(name);
}
