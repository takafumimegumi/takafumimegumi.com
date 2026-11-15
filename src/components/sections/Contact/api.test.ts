import { afterEach, describe, expect, it, vi } from "vitest";
import { createBooking, listOpenSlots, sendMessage } from "./api";

const BOOKING = {
  name: "Jane Doe",
  email: "jane@example.com",
  start: "2026-11-16T17:00:00.000Z",
  token: "token",
};
const MESSAGE = {
  name: "Jane Doe",
  email: "jane@example.com",
  text: "Hello",
  token: "token",
};

/** Makes fetch answer with a status and a JSON body. Returns the mock, to read what was sent. */
function answerWith(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function answerWithHtml(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("<html></html>", { status })),
  );
}

function failToConnect() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listOpenSlots", () => {
  it("returns the open times", async () => {
    const fetchMock = answerWith(200, { slots: [BOOKING.start] });

    expect(await listOpenSlots()).toEqual({ ok: true, slots: [BOOKING.start] });
    expect(fetchMock).toHaveBeenCalledWith("/api/slots", undefined);
  });

  it("returns no open times as a success", async () => {
    answerWith(200, { slots: [] });

    expect(await listOpenSlots()).toEqual({ ok: true, slots: [] });
  });

  it("fails when a 200 has no list of times", async () => {
    answerWith(200, {});

    expect(await listOpenSlots()).toEqual({ ok: false, reason: "failed" });
  });

  it.each([
    [429, "rate_limited"],
    [500, "failed"],
    [404, "failed"],
  ])("maps a %i to %s", async (status, reason) => {
    answerWith(status, { error: "ignored" });

    expect(await listOpenSlots()).toEqual({ ok: false, reason });
  });

  it("fails when the server cannot be reached", async () => {
    failToConnect();

    expect(await listOpenSlots()).toEqual({ ok: false, reason: "failed" });
  });
});

describe("createBooking", () => {
  it("posts the request as JSON and returns the booked time", async () => {
    const fetchMock = answerWith(201, {
      start: BOOKING.start,
      meetUrl: "https://meet.example/abc",
    });

    expect(await createBooking(BOOKING)).toEqual({
      ok: true,
      start: BOOKING.start,
      meetUrl: "https://meet.example/abc",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(BOOKING),
    });
  });

  it("returns a booking that has no meeting link", async () => {
    answerWith(201, { start: BOOKING.start });

    expect(await createBooking(BOOKING)).toEqual({
      ok: true,
      start: BOOKING.start,
      meetUrl: undefined,
    });
  });

  it("names the fields that a 400 lists", async () => {
    answerWith(400, { error: "invalid", fields: ["email"] });

    expect(await createBooking(BOOKING)).toEqual({
      ok: false,
      reason: "invalid",
      fields: ["email"],
    });
  });

  it("fails when a 400 lists no fields", async () => {
    answerWith(400, { error: "invalid", fields: [] });

    expect(await createBooking(BOOKING)).toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it.each([
    [403, "unverified"],
    [409, "taken"],
    [429, "rate_limited"],
    [500, "failed"],
  ])("maps a %i to %s", async (status, reason) => {
    answerWith(status, { error: "ignored" });

    expect(await createBooking(BOOKING)).toEqual({ ok: false, reason });
  });

  it("goes by the status when the body is an HTML error page", async () => {
    answerWithHtml(409);
    expect(await createBooking(BOOKING)).toEqual({
      ok: false,
      reason: "taken",
    });

    answerWithHtml(502);
    expect(await createBooking(BOOKING)).toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("fails when a 201 cannot be read", async () => {
    answerWithHtml(201);

    expect(await createBooking(BOOKING)).toEqual({
      ok: false,
      reason: "failed",
    });
  });

  it("fails when the server cannot be reached", async () => {
    failToConnect();

    expect(await createBooking(BOOKING)).toEqual({
      ok: false,
      reason: "failed",
    });
  });
});

describe("sendMessage", () => {
  it("posts the request as JSON", async () => {
    const fetchMock = answerWith(200, {});

    expect(await sendMessage(MESSAGE)).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(MESSAGE),
    });
  });

  it("names the fields that a 400 lists", async () => {
    answerWith(400, { error: "invalid", fields: ["name", "text"] });

    expect(await sendMessage(MESSAGE)).toEqual({
      ok: false,
      reason: "invalid",
      fields: ["name", "text"],
    });
  });

  it.each([
    [403, "unverified"],
    [429, "rate_limited"],
    [500, "failed"],
  ])("maps a %i to %s", async (status, reason) => {
    answerWith(status, { error: "ignored" });

    expect(await sendMessage(MESSAGE)).toEqual({ ok: false, reason });
  });

  it("fails when the server cannot be reached", async () => {
    failToConnect();

    expect(await sendMessage(MESSAGE)).toEqual({ ok: false, reason: "failed" });
  });
});
