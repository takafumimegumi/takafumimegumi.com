import { describe, expect, it } from "vitest";
import type { BookingResult } from "@/components/sections/Contact/api";
import {
  findInvalidBookingFields,
  INITIAL_BOOKING_STATE,
  reduceBookingState,
  type BookingState,
} from "./bookingState";

const START = "2026-11-16T17:00:00.000Z";
const LATER = "2026-11-16T18:00:00.000Z";
const SLOTS = [START, LATER];

const CHOOSING: BookingState = { status: "choosing", slots: SLOTS };
const ENTERING: BookingState = {
  status: "entering",
  slots: SLOTS,
  start: START,
  invalidFields: [],
};
const SUBMITTING: BookingState = {
  status: "submitting",
  slots: SLOTS,
  start: START,
};
const FAILED: BookingState = {
  status: "failed",
  slots: SLOTS,
  start: START,
  reason: "failed",
};

const finish = (result: BookingResult, from: BookingState = SUBMITTING) =>
  reduceBookingState(from, {
    type: "submitFinished",
    result,
    email: "jane@example.com",
  });

describe("reduceBookingState", () => {
  describe("loading the open times", () => {
    it("starts by loading", () => {
      expect(INITIAL_BOOKING_STATE).toEqual({ status: "loading" });
    });

    it("shows the open times once they are loaded", () => {
      const state = reduceBookingState(INITIAL_BOOKING_STATE, {
        type: "slotsLoaded",
        slots: SLOTS,
      });

      expect(state).toEqual(CHOOSING);
    });

    it("says there are no open times when the list is empty", () => {
      const state = reduceBookingState(INITIAL_BOOKING_STATE, {
        type: "slotsLoaded",
        slots: [],
      });

      expect(state).toEqual({ status: "empty" });
    });

    it("says the open times are unavailable when loading fails", () => {
      const state = reduceBookingState(INITIAL_BOOKING_STATE, {
        type: "slotsFailed",
      });

      expect(state).toEqual({ status: "unavailable" });
    });

    it("loads again when the visitor retries after a failure", () => {
      const state = reduceBookingState(
        { status: "unavailable" },
        { type: "slotsRequested" },
      );

      expect(state).toEqual({ status: "loading" });
    });

    it("keeps the open times when a retry is asked for without a failure", () => {
      expect(reduceBookingState(CHOOSING, { type: "slotsRequested" })).toBe(
        CHOOSING,
      );
    });

    it("ignores a late answer while the visitor is choosing or typing", () => {
      expect(reduceBookingState(CHOOSING, { type: "slotsFailed" })).toBe(
        CHOOSING,
      );
      expect(
        reduceBookingState(ENTERING, { type: "slotsLoaded", slots: [] }),
      ).toBe(ENTERING);
    });
  });

  describe("choosing a time", () => {
    it("asks for the details once a time is chosen", () => {
      expect(
        reduceBookingState(CHOOSING, { type: "slotChosen", start: START }),
      ).toEqual(ENTERING);
    });

    it("goes back to the open times when the visitor wants another time", () => {
      expect(
        reduceBookingState(ENTERING, { type: "slotChangeRequested" }),
      ).toEqual(CHOOSING);
      expect(
        reduceBookingState(FAILED, { type: "slotChangeRequested" }),
      ).toEqual(CHOOSING);
    });

    it("does not change the time while a booking is being sent", () => {
      expect(
        reduceBookingState(SUBMITTING, { type: "slotChangeRequested" }),
      ).toBe(SUBMITTING);
    });
  });

  describe("fields", () => {
    it("marks the fields the form rejects, and sends nothing", () => {
      const state = reduceBookingState(ENTERING, {
        type: "fieldsRejected",
        fields: ["name", "email"],
      });

      expect(state).toEqual({ ...ENTERING, invalidFields: ["name", "email"] });
    });

    it("clears the mark of a field once the visitor edits it", () => {
      const rejected: BookingState = {
        ...ENTERING,
        invalidFields: ["name", "email"],
      };

      expect(
        reduceBookingState(rejected, { type: "fieldEdited", name: "name" }),
      ).toEqual({ ...ENTERING, invalidFields: ["email"] });
    });
  });

  describe("sending", () => {
    it("starts sending from the details, and again after a failure", () => {
      expect(reduceBookingState(ENTERING, { type: "submitStarted" })).toEqual(
        SUBMITTING,
      );
      expect(reduceBookingState(FAILED, { type: "submitStarted" })).toEqual(
        SUBMITTING,
      );
    });

    it("ignores a second press while a booking is being sent", () => {
      expect(reduceBookingState(SUBMITTING, { type: "submitStarted" })).toBe(
        SUBMITTING,
      );
    });

    it("shows the booking once it is made", () => {
      const state = finish({
        ok: true,
        start: START,
        meetUrl: "https://meet.example/abc",
      });

      expect(state).toEqual({
        status: "booked",
        start: START,
        email: "jane@example.com",
        meetUrl: "https://meet.example/abc",
      });
    });

    it("goes back to the open times, without the time that was taken", () => {
      expect(finish({ ok: false, reason: "taken" })).toEqual({
        status: "taken",
        slots: [LATER],
      });
    });

    it("says there are no open times when the last one was taken", () => {
      const lastSlot: BookingState = { ...SUBMITTING, slots: [START] };

      expect(finish({ ok: false, reason: "taken" }, lastSlot)).toEqual({
        status: "empty",
      });
    });

    it("marks the fields the server rejects", () => {
      const state = finish({ ok: false, reason: "invalid", fields: ["email"] });

      expect(state).toEqual({ ...ENTERING, invalidFields: ["email"] });
    });

    it("fails when the server rejects only something the visitor cannot fix", () => {
      const state = finish({ ok: false, reason: "invalid", fields: ["token"] });

      expect(state).toEqual(FAILED);
    });

    it.each(["unverified", "rate_limited", "failed"] as const)(
      "keeps the details and gives the reason when the booking is %s",
      (reason) => {
        expect(finish({ ok: false, reason })).toEqual({ ...FAILED, reason });
      },
    );

    it("ignores an answer that arrives when nothing is being sent", () => {
      expect(finish({ ok: false, reason: "failed" }, ENTERING)).toBe(ENTERING);
    });
  });

  describe("after a time was taken", () => {
    const taken: BookingState = { status: "taken", slots: [LATER] };

    it("replaces the open times when they are loaded again", () => {
      const fresh = ["2026-11-17T17:00:00.000Z"];

      expect(
        reduceBookingState(taken, { type: "slotsLoaded", slots: fresh }),
      ).toEqual({ status: "taken", slots: fresh });
    });

    it("keeps the old open times when loading them again fails", () => {
      expect(reduceBookingState(taken, { type: "slotsFailed" })).toBe(taken);
    });

    it("lets the visitor choose another time", () => {
      expect(
        reduceBookingState(taken, { type: "slotChosen", start: LATER }),
      ).toEqual({
        status: "entering",
        slots: [LATER],
        start: LATER,
        invalidFields: [],
      });
    });
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

  it("rejects an email with no dot after the @, and one with no @", () => {
    expect(
      findInvalidBookingFields({ ...fields, email: "jane@company" }),
    ).toEqual(["email"]);
    expect(findInvalidBookingFields({ ...fields, email: "jane" })).toEqual([
      "email",
    ]);
  });

  it("accepts an email with spaces around it", () => {
    expect(
      findInvalidBookingFields({ ...fields, email: " jane@example.com " }),
    ).toEqual([]);
  });
});
