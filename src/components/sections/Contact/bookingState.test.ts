import { describe, expect, it } from "vitest";
import {
  INITIAL_BOOKING_STATE,
  reduceBookingState,
  type BookingState,
} from "./bookingState";

const SLOTS = ["2026-11-16T17:00:00.000Z", "2026-11-16T17:30:00.000Z"];
const CHOOSING: BookingState = { status: "choosing", slots: SLOTS };

describe("reduceBookingState", () => {
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

  it("ignores a late answer once it is no longer loading", () => {
    expect(reduceBookingState(CHOOSING, { type: "slotsFailed" })).toBe(
      CHOOSING,
    );
    expect(
      reduceBookingState(CHOOSING, { type: "slotsLoaded", slots: [] }),
    ).toBe(CHOOSING);
  });
});
