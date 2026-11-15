import { describe, expect, it, vi } from "vitest";
import type { AvailabilityRules, BusyTime } from "../types";
import { createBooking } from "./createBooking";

// Made-up rules: Mondays from 10:00 to 12:00. The real ones live in Worker configuration.
// Vancouver is UTC-7, so 10:00 there is 17:00 UTC.
const MOCK_RULES: AvailabilityRules = {
  windows: { "1": [[600, 720]] },
  slotMinutes: 30,
  minNoticeMinutes: 120,
  daysOffered: 1,
  bufferMinutes: 15,
};

// Monday 2026-11-16, 08:00 in Vancouver: exactly the notice before the first slot.
const MONDAY_MORNING = new Date("2026-11-16T15:00:00Z");
const TEN_O_CLOCK = "2026-11-16T17:00:00.000Z";

const MOCK_REQUEST = {
  name: "Jane Doe",
  email: "jane@example.com",
  topic: "A role on your team",
  start: TEN_O_CLOCK,
  token: "mock-token",
};

const MOCK_MEET_URL = "https://meet.google.com/abc-defg-hij";

const buildDependencies = (busyTimes: BusyTime[] = []) => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  verifyToken: vi.fn(async () => ({
    valid: true,
    action: "booking",
    hostname: "takafumimegumi.com",
  })),
  listBusyTimes: vi.fn(async () => busyTimes),
  createEvent: vi.fn(async (): Promise<{ id: string; meetUrl?: string }> => ({
    id: "mock-event",
    meetUrl: MOCK_MEET_URL,
  })),
  sendEmailToOwner: vi.fn(async () => {}),
  reportFailure: vi.fn(),
});

const book = (
  dependencies: ReturnType<typeof buildDependencies>,
  changes: object = {},
  now = MONDAY_MORNING,
) =>
  createBooking(dependencies, MOCK_RULES, { ...MOCK_REQUEST, ...changes }, now);

describe("createBooking", () => {
  describe("an open slot", () => {
    it("creates an event with the fixed title, the visitor as the guest, and the slot's length", async () => {
      const dependencies = buildDependencies();

      await book(dependencies);

      expect(dependencies.createEvent).toHaveBeenCalledWith({
        start: new Date(TEN_O_CLOCK),
        end: new Date("2026-11-16T17:30:00.000Z"),
        guestEmail: "jane@example.com",
        title: "30-minute call with Takafumi Megumi",
      });
    });

    it("returns the start and the Meet link", async () => {
      const result = await book(buildDependencies());

      expect(result).toEqual({
        ok: true,
        start: new Date(TEN_O_CLOCK),
        meetUrl: MOCK_MEET_URL,
      });
    });

    it("emails me the details after the event is created", async () => {
      const dependencies = buildDependencies();

      await book(dependencies);

      expect(dependencies.sendEmailToOwner).toHaveBeenCalledWith({
        senderName: "Jane Doe (booking)",
        replyToAddress: "jane@example.com",
        subject: "Booking: Nov 16, 10:00 AM",
        text: [
          "When: Nov 16, 10:00 AM (Vancouver)",
          "Name: Jane Doe",
          "Email: jane@example.com",
          "",
          "A role on your team",
        ].join("\n"),
      });
      expect(dependencies.createEvent.mock.invocationCallOrder[0]).toBeLessThan(
        dependencies.sendEmailToOwner.mock.invocationCallOrder[0],
      );
    });

    it("says so in the email when no topic was given, or an empty one", async () => {
      for (const topic of [undefined, "  "]) {
        const dependencies = buildDependencies();

        await book(dependencies, { topic });

        expect(dependencies.sendEmailToOwner).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringMatching(/\n\nNo topic given\.$/),
          }),
        );
      }
    });

    it("removes the spaces around the name and the address", async () => {
      const dependencies = buildDependencies();

      await book(dependencies, {
        name: "  Jane Doe ",
        email: " jane@example.com ",
      });

      expect(dependencies.sendEmailToOwner).toHaveBeenCalledWith(
        expect.objectContaining({
          senderName: "Jane Doe (booking)",
          replyToAddress: "jane@example.com",
        }),
      );
    });
  });

  describe("the request", () => {
    it("refuses a name of spaces only", async () => {
      const result = await book(buildDependencies(), { name: "   " });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["name"],
      });
    });

    it("refuses a name with a line break in it", async () => {
      const result = await book(buildDependencies(), {
        name: "Jane\nBcc: someone@example.com",
      });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["name"],
      });
    });

    it("refuses a start that is not an ISO time", async () => {
      const result = await book(buildDependencies(), {
        start: "Nov 16, 10:00 AM",
      });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["start"],
      });
    });

    it("refuses an address without a dot in its domain, which a browser accepts", async () => {
      const result = await book(buildDependencies(), { email: "jane@company" });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["email"],
      });
    });

    it("names every field that is wrong", async () => {
      const result = await book(buildDependencies(), {
        name: "",
        start: "soon",
      });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["name", "start"],
      });
    });

    it("refuses a request without an address, and does not verify the token", async () => {
      const dependencies = buildDependencies();

      const result = await book(dependencies, { email: undefined });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["email"],
      });
      expect(dependencies.verifyToken).not.toHaveBeenCalled();
    });

    it("refuses a body that is not an object", async () => {
      const result = await createBooking(
        buildDependencies(),
        MOCK_RULES,
        undefined,
        MONDAY_MORNING,
      );

      expect(result).toEqual({ ok: false, reason: "invalid", fields: [] });
    });
  });

  describe("abuse", () => {
    it("returns rate_limited and calls nothing else when the limit is reached", async () => {
      const dependencies = buildDependencies();
      dependencies.checkRateLimit.mockResolvedValue({ allowed: false });

      const result = await book(dependencies);

      expect(result).toEqual({ ok: false, reason: "rate_limited" });
      expect(dependencies.verifyToken).not.toHaveBeenCalled();
      expect(dependencies.createEvent).not.toHaveBeenCalled();
    });

    it("returns unverified without reading the calendar when the token is not valid", async () => {
      const dependencies = buildDependencies();
      dependencies.verifyToken.mockResolvedValue({
        valid: false,
        action: "booking",
        hostname: "takafumimegumi.com",
      });

      const result = await book(dependencies);

      expect(result).toEqual({ ok: false, reason: "unverified" });
      expect(dependencies.listBusyTimes).not.toHaveBeenCalled();
    });

    it("returns unverified for a token made for the message form", async () => {
      const dependencies = buildDependencies();
      dependencies.verifyToken.mockResolvedValue({
        valid: true,
        action: "message",
        hostname: "takafumimegumi.com",
      });

      expect(await book(dependencies)).toEqual({
        ok: false,
        reason: "unverified",
      });
    });

    it("returns unverified for a token made on another site", async () => {
      const dependencies = buildDependencies();
      dependencies.verifyToken.mockResolvedValue({
        valid: true,
        action: "booking",
        hostname: "example.com",
      });

      expect(await book(dependencies)).toEqual({
        ok: false,
        reason: "unverified",
      });
    });
  });

  describe("the chosen time", () => {
    it("reads busy times from one buffer before now to one buffer after the days offered", async () => {
      const dependencies = buildDependencies();

      await book(dependencies);

      expect(dependencies.listBusyTimes).toHaveBeenCalledWith(
        new Date("2026-11-16T14:45:00Z"),
        new Date("2026-11-17T15:15:00Z"),
      );
    });

    it("returns taken without creating an event when the time has just been taken", async () => {
      const dependencies = buildDependencies([
        { start: new Date(TEN_O_CLOCK), end: new Date("2026-11-16T17:30:00Z") },
      ]);

      const result = await book(dependencies);

      expect(result).toEqual({ ok: false, reason: "taken" });
      expect(dependencies.createEvent).not.toHaveBeenCalled();
      expect(dependencies.sendEmailToOwner).not.toHaveBeenCalled();
    });

    it("returns taken for a time that is not the start of a slot", async () => {
      const result = await book(buildDependencies(), {
        start: "2026-11-16T17:10:00.000Z",
      });

      expect(result).toEqual({ ok: false, reason: "taken" });
    });

    it("books a slot that starts exactly when the notice ends, and returns taken one minute later", async () => {
      const oneMinuteLater = new Date("2026-11-16T15:01:00Z");

      expect(await book(buildDependencies())).toMatchObject({ ok: true });
      expect(await book(buildDependencies(), {}, oneMinuteLater)).toEqual({
        ok: false,
        reason: "taken",
      });
    });
  });

  describe("a failure after the event is created", () => {
    it("keeps the booking and reports it when the email to me fails", async () => {
      const dependencies = buildDependencies();
      const failure = new Error("cloudflare_email:send_email_to_owner:unknown");
      dependencies.sendEmailToOwner.mockRejectedValue(failure);

      const result = await book(dependencies);

      expect(result).toMatchObject({ ok: true, meetUrl: MOCK_MEET_URL });
      expect(dependencies.reportFailure).toHaveBeenCalledWith(
        "bookings",
        failure,
      );
    });

    it("keeps the booking and reports it when Google returns no Meet link", async () => {
      const dependencies = buildDependencies();
      dependencies.createEvent.mockResolvedValue({ id: "mock-event" });

      const result = await book(dependencies);

      expect(result).toEqual({ ok: true, start: new Date(TEN_O_CLOCK) });
      expect(dependencies.reportFailure).toHaveBeenCalledWith(
        "bookings",
        expect.objectContaining({
          code: "google_calendar:create_event:no_meet_url",
        }),
      );
      expect(dependencies.sendEmailToOwner).toHaveBeenCalled();
    });

    it("puts nothing the visitor typed into the report", async () => {
      const dependencies = buildDependencies();
      dependencies.createEvent.mockResolvedValue({ id: "mock-event" });

      await book(dependencies);

      const [, failure] = dependencies.reportFailure.mock.calls[0];
      expect(String(failure.message)).not.toMatch(/Jane|example\.com|role/);
    });
  });

  it("lets a failure to create the event throw, and sends no email", async () => {
    const dependencies = buildDependencies();
    const failure = new Error("google_calendar:create_event:500");
    dependencies.createEvent.mockRejectedValue(failure);

    await expect(book(dependencies)).rejects.toBe(failure);
    expect(dependencies.sendEmailToOwner).not.toHaveBeenCalled();
  });
});
