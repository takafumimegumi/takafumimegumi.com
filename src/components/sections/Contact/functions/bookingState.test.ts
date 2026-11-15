import { describe, expect, it } from "vitest";
import type { BookingResult } from "@/components/sections/Contact/api";
import {
  findInvalidBookingFields,
  hasNoSlotsToShow,
  INITIAL_BOOKING_STATE,
  reduceBookingState,
  type BookingState,
  type BookingStep,
  type SlotsState,
} from "./bookingState";

const START = "2026-11-16T17:00:00.000Z";
const LATER = "2026-11-16T18:00:00.000Z";
const FRESH = ["2026-11-17T17:00:00.000Z"];

const LOADED: SlotsState = { status: "loaded", slots: [START, LATER] };
const ENTERING: BookingStep = {
  status: "entering",
  start: START,
  mayBeBooked: false,
  invalidFields: [],
};
const SUBMITTING: BookingStep = {
  status: "submitting",
  start: START,
  mayBeBooked: false,
};
// A booking that got no answer may have been made.
const FAILED: BookingStep = {
  status: "failed",
  start: START,
  mayBeBooked: true,
  reason: "failed",
};
const TAKEN: BookingStep = { status: "taken", mayBeBooked: false };

const at = (step: BookingStep, slots: SlotsState = LOADED): BookingState => ({
  slots,
  step,
});
const CHOOSING = at({ status: "choosing" });

const finish = (result: BookingResult, from: BookingState = at(SUBMITTING)) =>
  reduceBookingState(from, {
    type: "submitFinished",
    result,
    email: "jane@example.com",
  });

describe("reduceBookingState", () => {
  describe("loading the open times", () => {
    it("starts by loading, with nothing chosen", () => {
      expect(INITIAL_BOOKING_STATE).toEqual({
        slots: { status: "loading" },
        step: { status: "choosing" },
      });
    });

    it("keeps the open times once they are loaded", () => {
      const state = reduceBookingState(INITIAL_BOOKING_STATE, {
        type: "slotsLoaded",
        slots: [START, LATER],
      });

      expect(state).toEqual(CHOOSING);
    });

    it("says the open times are unavailable when the first load fails", () => {
      const state = reduceBookingState(INITIAL_BOOKING_STATE, {
        type: "slotsFailed",
      });

      expect(state.slots).toEqual({ status: "unavailable" });
    });

    it("loads again when the visitor retries after a failure", () => {
      const state = reduceBookingState(
        at({ status: "choosing" }, { status: "unavailable" }),
        { type: "slotsRequested" },
      );

      expect(state.slots).toEqual({ status: "loading" });
    });

    it("keeps the list on screen while it is loaded again, and when that fails", () => {
      expect(reduceBookingState(CHOOSING, { type: "slotsRequested" })).toBe(
        CHOOSING,
      );
      expect(reduceBookingState(CHOOSING, { type: "slotsFailed" })).toBe(
        CHOOSING,
      );
    });

    it.each([ENTERING, SUBMITTING, FAILED, TAKEN] as const)(
      "takes a new list at the $status step, without leaving the step",
      (step) => {
        const state = reduceBookingState(at(step), {
          type: "slotsLoaded",
          slots: FRESH,
        });

        expect(state).toEqual(at(step, { status: "loaded", slots: FRESH }));
      },
    );
  });

  describe("choosing a time", () => {
    it("asks for the details once a time is chosen", () => {
      expect(
        reduceBookingState(CHOOSING, { type: "slotChosen", start: START }),
      ).toEqual(at(ENTERING));
    });

    it("goes back to the open times when the visitor wants another time", () => {
      expect(
        reduceBookingState(at(ENTERING), { type: "slotChangeRequested" }),
      ).toEqual(CHOOSING);
      expect(
        reduceBookingState(at(FAILED), { type: "slotChangeRequested" }),
      ).toEqual(CHOOSING);
    });

    it("does not change the time while a booking is being sent", () => {
      const sending = at(SUBMITTING);

      expect(reduceBookingState(sending, { type: "slotChangeRequested" })).toBe(
        sending,
      );
    });
  });

  describe("fields", () => {
    it("marks the fields the form rejects, and sends nothing", () => {
      const state = reduceBookingState(at(ENTERING), {
        type: "fieldsRejected",
        fields: ["name", "email"],
      });

      expect(state.step).toEqual({
        ...ENTERING,
        invalidFields: ["name", "email"],
      });
    });

    it("clears the mark of a field once the visitor edits it", () => {
      const rejected = at({ ...ENTERING, invalidFields: ["name", "email"] });

      expect(
        reduceBookingState(rejected, { type: "fieldEdited", name: "name" })
          .step,
      ).toEqual({ ...ENTERING, invalidFields: ["email"] });
    });
  });

  describe("sending", () => {
    it("starts sending from the details, and again after a failure", () => {
      expect(
        reduceBookingState(at(ENTERING), { type: "submitStarted" }).step,
      ).toEqual(SUBMITTING);
      expect(
        reduceBookingState(at(FAILED), { type: "submitStarted" }).step,
      ).toEqual({ ...SUBMITTING, mayBeBooked: true });
    });

    it("ignores a second press while a booking is being sent", () => {
      const sending = at(SUBMITTING);

      expect(reduceBookingState(sending, { type: "submitStarted" })).toBe(
        sending,
      );
    });

    it("shows the booking once it is made", () => {
      const state = finish({
        ok: true,
        start: START,
        meetUrl: "https://meet.example/abc",
      });

      expect(state.step).toEqual({
        status: "booked",
        start: START,
        email: "jane@example.com",
        meetUrl: "https://meet.example/abc",
      });
    });

    it("goes back to the open times, without the time that was taken", () => {
      expect(finish({ ok: false, reason: "taken" })).toEqual(
        at(TAKEN, { status: "loaded", slots: [LATER] }),
      );
    });

    it("marks the fields the server rejects", () => {
      const state = finish({ ok: false, reason: "invalid", fields: ["email"] });

      expect(state.step).toEqual({ ...ENTERING, invalidFields: ["email"] });
    });

    it.each([["token"], []])(
      "says the booking was rejected when the server names no field the visitor can fix",
      (...fields) => {
        const state = finish({ ok: false, reason: "invalid", fields });

        // A rejected request booked nothing.
        expect(state.step).toEqual({
          status: "failed",
          start: START,
          mayBeBooked: false,
          reason: "rejected",
        });
      },
    );

    it.each(["unverified", "rate_limited"] as const)(
      "keeps the details and gives the reason when the booking is %s",
      (reason) => {
        expect(finish({ ok: false, reason }).step).toEqual({
          status: "failed",
          start: START,
          mayBeBooked: false,
          reason,
        });
      },
    );

    it("notes that the call may be booked when no answer came", () => {
      expect(finish({ ok: false, reason: "failed" }).step).toEqual(FAILED);
    });

    it("ignores an answer that arrives when nothing is being sent", () => {
      const entering = at(ENTERING);

      expect(finish({ ok: false, reason: "failed" }, entering)).toBe(entering);
    });
  });

  describe("trying again after no answer came", () => {
    const retry = at({ ...SUBMITTING, mayBeBooked: true });

    it("remembers that the call may be booked when the time turns out taken", () => {
      expect(finish({ ok: false, reason: "taken" }, retry).step).toEqual({
        status: "taken",
        mayBeBooked: true,
      });
    });

    it("keeps remembering it through a failure that books nothing", () => {
      const step = finish({ ok: false, reason: "unverified" }, retry).step;

      expect(step).toMatchObject({ status: "failed", mayBeBooked: true });
    });

    it("forgets it once the visitor chooses a time again", () => {
      const taken = finish({ ok: false, reason: "taken" }, retry);

      expect(
        reduceBookingState(taken, { type: "slotChosen", start: LATER }).step,
      ).toMatchObject({ status: "entering", mayBeBooked: false });
    });
  });

  describe("after a time was taken", () => {
    it("shows times again when the last one on the list was taken and a new list arrives", () => {
      const lastOne = at(SUBMITTING, { status: "loaded", slots: [START] });
      const taken = finish({ ok: false, reason: "taken" }, lastOne);

      expect(taken.slots).toEqual({ status: "loaded", slots: [] });
      expect(
        reduceBookingState(taken, { type: "slotsLoaded", slots: FRESH }),
      ).toEqual(at(TAKEN, { status: "loaded", slots: FRESH }));
    });

    it("shows the new list after the visitor chose another time before it arrived", () => {
      const taken = finish({ ok: false, reason: "taken" });
      const entering = reduceBookingState(taken, {
        type: "slotChosen",
        start: LATER,
      });
      const refreshed = reduceBookingState(entering, {
        type: "slotsLoaded",
        slots: FRESH,
      });

      expect(
        reduceBookingState(refreshed, { type: "slotChangeRequested" }),
      ).toEqual(at({ status: "choosing" }, { status: "loaded", slots: FRESH }));
    });
  });
});

describe("hasNoSlotsToShow", () => {
  const empty: SlotsState = { status: "loaded", slots: [] };

  it("is true when the times could not be loaded, or there are none", () => {
    expect(
      hasNoSlotsToShow(at({ status: "choosing" }, { status: "unavailable" })),
    ).toBe(true);
    expect(hasNoSlotsToShow(at(TAKEN, empty))).toBe(true);
  });

  it("is false while the times load, and when there is one to pick", () => {
    expect(hasNoSlotsToShow(INITIAL_BOOKING_STATE)).toBe(false);
    expect(
      hasNoSlotsToShow(
        at({ status: "choosing" }, { status: "loaded", slots: [START] }),
      ),
    ).toBe(false);
  });

  it("is false on the form and the confirmation, whatever the list holds", () => {
    expect(hasNoSlotsToShow(at(ENTERING, empty))).toBe(false);
  });
});

describe("findInvalidBookingFields", () => {
  const fields = { name: "Jane Doe", email: "jane@example.com", topic: "" };

  it("accepts a name and an email, without a topic", () => {
    expect(findInvalidBookingFields(fields)).toEqual([]);
  });

  it("rejects a name of only spaces", () => {
    expect(findInvalidBookingFields({ ...fields, name: "  " })).toEqual([
      "name",
    ]);
  });

  it("rejects an email that is not shaped like one", () => {
    expect(
      findInvalidBookingFields({ ...fields, email: "jane@company" }),
    ).toEqual(["email"]);
  });
});
