import { useEffect, useReducer, useState } from "preact/hooks";
import { listOpenSlots } from "@/components/sections/Contact/api";
import {
  INITIAL_BOOKING_STATE,
  reduceBookingState,
  type BookingState,
} from "@/components/sections/Contact/functions/bookingState";

export interface Booking {
  state: BookingState;
  /** The visitor's time zone. Undefined until the page runs in the browser. */
  timeZone: string | undefined;
  /** Asks for the open times again, after they could not be loaded. */
  reloadSlots: () => void;
}

/** Holds the state of the booking panel and loads the open times. */
export function useBooking(): Booking {
  const [state, dispatch] = useReducer(
    reduceBookingState,
    INITIAL_BOOKING_STATE,
  );
  const [timeZone, setTimeZone] = useState<string>();

  async function loadSlots() {
    dispatch({ type: "slotsRequested" });
    const result = await listOpenSlots();
    dispatch(
      result.ok
        ? { type: "slotsLoaded", slots: result.slots }
        : { type: "slotsFailed" },
    );
  }

  // Both run after mounting: the build has no visitor, so it draws neither a time zone nor times.
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  useEffect(() => {
    void loadSlots();
  }, []);

  return { state, timeZone, reloadSlots: () => void loadSlots() };
}
