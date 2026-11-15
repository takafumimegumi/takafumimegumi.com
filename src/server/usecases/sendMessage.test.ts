import { describe, expect, it, vi } from "vitest";
import { sendMessage } from "./sendMessage";

const MOCK_REQUEST = {
  name: "Jane Doe",
  email: "jane@example.com",
  text: "Do you take contract work?\nI have a small project.",
  token: "mock-token",
};

const buildDependencies = () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  verifyToken: vi.fn(async () => ({
    valid: true,
    action: "message",
    hostname: "takafumimegumi.com",
  })),
  sendEmailToOwner: vi.fn(async () => {}),
});

const send = (
  dependencies: ReturnType<typeof buildDependencies>,
  changes: object = {},
) => sendMessage(dependencies, { ...MOCK_REQUEST, ...changes });

describe("sendMessage", () => {
  it("emails me the message, with the visitor as the reply-to", async () => {
    const dependencies = buildDependencies();

    const result = await send(dependencies);

    expect(result).toEqual({ ok: true });
    expect(dependencies.sendEmailToOwner).toHaveBeenCalledWith({
      senderName: "Jane Doe (contact form)",
      replyToAddress: "jane@example.com",
      subject: "Message from Jane Doe",
      text: [
        "Do you take contract work?",
        "I have a small project.",
        "",
        "Jane Doe <jane@example.com>",
      ].join("\n"),
    });
  });

  it("removes the spaces around the name, the address, and the message", async () => {
    const dependencies = buildDependencies();

    await send(dependencies, {
      name: " Jane Doe ",
      email: " jane@example.com ",
      text: "\n Hello. \n",
    });

    expect(dependencies.sendEmailToOwner).toHaveBeenCalledWith(
      expect.objectContaining({
        senderName: "Jane Doe (contact form)",
        replyToAddress: "jane@example.com",
        text: "Hello.\n\nJane Doe <jane@example.com>",
      }),
    );
  });

  describe("the request", () => {
    it("refuses a name of spaces only", async () => {
      const result = await send(buildDependencies(), { name: "   " });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["name"],
      });
    });

    it("refuses a name with a line break in it", async () => {
      const result = await send(buildDependencies(), {
        name: "Jane\nBcc: someone@example.com",
      });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["name"],
      });
    });

    it("refuses a message of spaces only", async () => {
      const result = await send(buildDependencies(), { text: " \n " });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["text"],
      });
    });

    it("refuses an address without a dot in its domain, which a browser accepts", async () => {
      const result = await send(buildDependencies(), { email: "jane@company" });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["email"],
      });
    });

    it("refuses a request without an address, and does not verify the token", async () => {
      const dependencies = buildDependencies();

      const result = await send(dependencies, { email: undefined });

      expect(result).toEqual({
        ok: false,
        reason: "invalid",
        fields: ["email"],
      });
      expect(dependencies.verifyToken).not.toHaveBeenCalled();
    });

    it("refuses a body that is not an object", async () => {
      const result = await sendMessage(buildDependencies(), undefined);

      expect(result).toEqual({ ok: false, reason: "invalid", fields: [] });
    });
  });

  describe("abuse", () => {
    it("returns rate_limited and calls nothing else when the limit is reached", async () => {
      const dependencies = buildDependencies();
      dependencies.checkRateLimit.mockResolvedValue({ allowed: false });

      const result = await send(dependencies);

      expect(result).toEqual({ ok: false, reason: "rate_limited" });
      expect(dependencies.verifyToken).not.toHaveBeenCalled();
      expect(dependencies.sendEmailToOwner).not.toHaveBeenCalled();
    });

    it("returns unverified without sending when the token is not valid", async () => {
      const dependencies = buildDependencies();
      dependencies.verifyToken.mockResolvedValue({
        valid: false,
        action: "message",
        hostname: "takafumimegumi.com",
      });

      const result = await send(dependencies);

      expect(result).toEqual({ ok: false, reason: "unverified" });
      expect(dependencies.sendEmailToOwner).not.toHaveBeenCalled();
    });

    it("returns unverified for a token made for the booking form", async () => {
      const dependencies = buildDependencies();
      dependencies.verifyToken.mockResolvedValue({
        valid: true,
        action: "booking",
        hostname: "takafumimegumi.com",
      });

      expect(await send(dependencies)).toEqual({
        ok: false,
        reason: "unverified",
      });
    });
  });

  it("lets a failure to send the email throw, since the message is lost", async () => {
    const dependencies = buildDependencies();
    const failure = new Error("cloudflare_email:send_email_to_owner:unknown");
    dependencies.sendEmailToOwner.mockRejectedValue(failure);

    await expect(send(dependencies)).rejects.toBe(failure);
  });
});
