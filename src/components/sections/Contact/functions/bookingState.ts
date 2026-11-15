import type { BookingResult } from "@/components/sections/Contact/api";
import { isEmailLike } from "./isEmailLike";

export type BookingFieldName = "name" | "email" | "topic";
export type BookingFields = Record<BookingFieldName, string>;

/**
 * Why a booking did not go through, when no field is to blame.
 * "failed" leaves it unknown whether the call was booked. With the others it was not.
 */
export type BookingFailure =
  "unverified" | "rate_limited" | "rejected" | "failed";

/** The open times. They are kept apart from the step, so they can be loaded again at any step. */
export type SlotsState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "loaded"; slots: string[] };

interface Attempt {
  start: string;
  /** An earlier try for this time ended without an answer, so the call may be booked already (ADR-0007). */
  mayBeBooked: boolean;
}

export type BookingStep =
  | { status: "choosing" }
  | { status: "taken"; mayBeBooked: boolean }
  | ({ status: "entering"; invalidFields: BookingFieldName[] } & Attempt)
  | ({ status: "submitting" } & Attempt)
  | ({ status: "failed"; reason: BookingFailure } & Attempt)
  | { status: "booked"; start: string; email: string; meetUrl?: string };

/** What the booking panel shows: the step decides the screen, and the open times fill it. */
export interface BookingState {
  slots: SlotsState;
  step: BookingStep;
}

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

// The page is built in this state, before any open time is known.
export const INITIAL_BOOKING_STATE: BookingState = {
  slots: { status: "loading" },
  step: { status: "choosing" },
};

/** Returns the next state. An event that does not fit the current state changes nothing. */
export function reduceBookingState(
  state: BookingState,
  event: BookingEvent,
): BookingState {
  const { slots, step } = state;

  switch (event.type) {
    // A list that is on screen stays there while it is loaded again.
    case "slotsRequested":
      return slots.status === "unavailable"
        ? { ...state, slots: { status: "loading" } }
        : state;

    case "slotsLoaded":
      return { ...state, slots: { status: "loaded", slots: event.slots } };

    case "slotsFailed":
      return slots.status === "loading"
        ? { ...state, slots: { status: "unavailable" } }
        : state;

    case "slotChosen":
      if (step.status !== "choosing" && step.status !== "taken") return state;
      return {
        ...state,
        step: {
          status: "entering",
          start: event.start,
          mayBeBooked: false,
          invalidFields: [],
        },
      };

    case "slotChangeRequested":
      if (step.status !== "entering" && step.status !== "failed") return state;
      return { ...state, step: { status: "choosing" } };

    case "fieldEdited":
      if (step.status !== "entering") return state;
      return {
        ...state,
        step: {
          ...step,
          invalidFields: step.invalidFields.filter(
            (name) => name !== event.name,
          ),
        },
      };

    case "fieldsRejected":
      if (step.status !== "entering" && step.status !== "failed") return state;
      return {
        ...state,
        step: {
          status: "entering",
          start: step.start,
          mayBeBooked: step.mayBeBooked,
          invalidFields: event.fields,
        },
      };

    case "submitStarted":
      if (step.status !== "entering" && step.status !== "failed") return state;
      return {
        ...state,
        step: {
          status: "submitting",
          start: step.start,
          mayBeBooked: step.mayBeBooked,
        },
      };

    case "submitFinished":
      if (step.status !== "submitting") return state;
      return reduceSubmitResult(slots, step, event.result, event.email);
  }
}

/** True when the panel has a short message to show in place of the open times. */
export function hasNoSlotsToShow({ slots, step }: BookingState): boolean {
  if (step.status !== "choosing" && step.status !== "taken") return false;
  return (
    slots.status === "unavailable" ||
    (slots.status === "loaded" && slots.slots.length === 0)
  );
}

export function findInvalidBookingFields(
  fields: BookingFields,
): BookingFieldName[] {
  const invalidFields: BookingFieldName[] = [];
  if (fields.name.trim() === "") invalidFields.push("name");
  if (!isEmailLike(fields.email)) invalidFields.push("email");
  return invalidFields;
}

function reduceSubmitResult(
  slots: SlotsState,
  { start, mayBeBooked }: Attempt,
  result: BookingResult,
  email: string,
): BookingState {
  if (result.ok) {
    return {
      slots,
      step: {
        status: "booked",
        start: result.start,
        email,
        meetUrl: result.meetUrl,
      },
    };
  }

  switch (result.reason) {
    case "invalid": {
      // The server can also name a field the visitor does not fill in, such as the token.
      const invalidFields = result.fields.filter(isBookingFieldName);
      const step: BookingStep =
        invalidFields.length > 0
          ? { status: "entering", start, mayBeBooked, invalidFields }
          : { status: "failed", start, mayBeBooked, reason: "rejected" };
      return { slots, step };
    }
    // The time goes away at once. The rest of the list follows when it is loaded again.
    case "taken":
      return {
        slots:
          slots.status === "loaded"
            ? {
                status: "loaded",
                slots: slots.slots.filter((slot) => slot !== start),
              }
            : slots,
        step: { status: "taken", mayBeBooked },
      };
    case "failed":
      return {
        slots,
        step: { status: "failed", start, mayBeBooked: true, reason: "failed" },
      };
    default:
      return {
        slots,
        step: { status: "failed", start, mayBeBooked, reason: result.reason },
      };
  }
}

function isBookingFieldName(name: string): name is BookingFieldName {
  return FIELD_NAMES.includes(name);
}
