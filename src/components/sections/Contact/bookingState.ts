/** What the booking panel shows. The status decides the screen. */
export type BookingState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "empty" }
  | { status: "choosing"; slots: string[] };

/** Something that happened, which may move the booking to another status. */
export type BookingEvent =
  | { type: "slotsRequested" }
  | { type: "slotsLoaded"; slots: string[] }
  | { type: "slotsFailed" };

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
      if (state.status !== "loading") return state;
      return event.slots.length > 0
        ? { status: "choosing", slots: event.slots }
        : { status: "empty" };
    case "slotsFailed":
      return state.status === "loading" ? { status: "unavailable" } : state;
  }
}
