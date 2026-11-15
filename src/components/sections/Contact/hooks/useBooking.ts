import { useEffect, useReducer, useState } from "preact/hooks";
import {
  createBooking,
  listOpenSlots,
  type BookingResult,
} from "@/components/sections/Contact/api";
import {
  findInvalidBookingFields,
  INITIAL_BOOKING_STATE,
  reduceBookingState,
  type BookingFieldName,
  type BookingFields,
  type BookingState,
} from "@/components/sections/Contact/functions/bookingState";
import { cleanName } from "@/components/sections/Contact/functions/cleanName";
import type { RequestToken } from "@/components/sections/Contact/ui/Turnstile";

export interface Booking {
  state: BookingState;
  /** The visitor's time zone. Undefined until the page runs in the browser. */
  timeZone: string | undefined;
  fields: BookingFields;
  /** Goes up each time fields are rejected, by the form or by the server. */
  rejectionCount: number;
  reloadSlots: () => void;
  chooseSlot: (start: string) => void;
  changeSlot: () => void;
  updateField: (name: BookingFieldName, value: string) => void;
  submit: (requestToken: RequestToken) => void;
}

export function useBooking(): Booking {
  const [state, dispatch] = useReducer(
    reduceBookingState,
    INITIAL_BOOKING_STATE,
  );
  const [timeZone, setTimeZone] = useState<string>();
  const [fields, setFields] = useState<BookingFields>({
    name: "",
    email: "",
    topic: "",
  });

  async function loadSlots() {
    dispatch({ type: "slotsRequested" });
    const result = await listOpenSlots();
    dispatch(
      result.ok
        ? { type: "slotsLoaded", slots: result.slots }
        : { type: "slotsFailed" },
    );
  }

  const [rejectionCount, setRejectionCount] = useState(0);

  async function submit(requestToken: RequestToken) {
    const { step } = state;
    if (step.status !== "entering" && step.status !== "failed") return;

    const invalidFields = findInvalidBookingFields(fields);
    if (invalidFields.length > 0) {
      dispatch({ type: "fieldsRejected", fields: invalidFields });
      setRejectionCount((count) => count + 1);
      return;
    }

    dispatch({ type: "submitStarted" });
    const email = fields.email.trim();
    const token = await requestToken();
    const result: BookingResult =
      token === undefined
        ? { ok: false, reason: "unverified" }
        : await createBooking({
            name: cleanName(fields.name),
            email,
            topic: fields.topic.trim() || undefined,
            start: step.start,
            token,
          });
    dispatch({ type: "submitFinished", result, email });
    if (!result.ok && result.reason === "invalid") {
      setRejectionCount((count) => count + 1);
    }

    // Other times may be gone too, so the list is loaded again behind the notice.
    if (!result.ok && result.reason === "taken") void loadSlots();
  }

  // Both run after mounting: the build has no visitor, so it draws neither a time zone nor times.
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  useEffect(() => {
    void loadSlots();
  }, []);

  return {
    state,
    timeZone,
    fields,
    rejectionCount,
    reloadSlots: () => void loadSlots(),
    chooseSlot: (start) => dispatch({ type: "slotChosen", start }),
    changeSlot: () => dispatch({ type: "slotChangeRequested" }),
    updateField: (name, value) => {
      // From the latest values: autofill changes two fields before the next render.
      setFields((latest) => ({ ...latest, [name]: value }));
      dispatch({ type: "fieldEdited", name });
    },
    submit: (requestToken) => void submit(requestToken),
  };
}
