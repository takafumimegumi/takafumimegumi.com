import { describe, expect, it } from "vitest";
import type { MessageResult } from "@/components/sections/Contact/api";
import {
  findInvalidMessageFields,
  INITIAL_MESSAGE_STATE,
  reduceMessageState,
  type MessageState,
} from "./messageState";

const EDITING = INITIAL_MESSAGE_STATE;
const SUBMITTING: MessageState = { status: "submitting" };
const FAILED: MessageState = { status: "failed", reason: "failed" };
const SENT: MessageState = { status: "sent", email: "jane@example.com" };

const finish = (result: MessageResult, from: MessageState = SUBMITTING) =>
  reduceMessageState(from, {
    type: "submitFinished",
    result,
    email: "jane@example.com",
  });

describe("reduceMessageState", () => {
  it("starts with an empty form and no marked fields", () => {
    expect(INITIAL_MESSAGE_STATE).toEqual({
      status: "editing",
      invalidFields: [],
    });
  });

  describe("fields", () => {
    it("marks the fields the form rejects, and sends nothing", () => {
      const state = reduceMessageState(EDITING, {
        type: "fieldsRejected",
        fields: ["email", "text"],
      });

      expect(state).toEqual({
        status: "editing",
        invalidFields: ["email", "text"],
      });
    });

    it("clears the mark of a field once the visitor edits it", () => {
      const rejected: MessageState = {
        status: "editing",
        invalidFields: ["email", "text"],
      };

      expect(
        reduceMessageState(rejected, { type: "fieldEdited", name: "text" }),
      ).toEqual({ status: "editing", invalidFields: ["email"] });
    });
  });

  describe("sending", () => {
    it("starts sending from the form, and again after a failure", () => {
      expect(reduceMessageState(EDITING, { type: "submitStarted" })).toEqual(
        SUBMITTING,
      );
      expect(reduceMessageState(FAILED, { type: "submitStarted" })).toEqual(
        SUBMITTING,
      );
    });

    it("ignores a second press while a message is being sent", () => {
      expect(reduceMessageState(SUBMITTING, { type: "submitStarted" })).toBe(
        SUBMITTING,
      );
    });

    it("shows where the reply will go once the message is sent", () => {
      expect(finish({ ok: true })).toEqual(SENT);
    });

    it("marks the fields the server rejects", () => {
      const state = finish({ ok: false, reason: "invalid", fields: ["email"] });

      expect(state).toEqual({ status: "editing", invalidFields: ["email"] });
    });

    it("fails when the server rejects only something the visitor cannot fix", () => {
      const state = finish({ ok: false, reason: "invalid", fields: ["token"] });

      expect(state).toEqual(FAILED);
    });

    it.each(["unverified", "rate_limited", "failed"] as const)(
      "gives the reason when the message is %s",
      (reason) => {
        expect(finish({ ok: false, reason })).toEqual({
          status: "failed",
          reason,
        });
      },
    );

    it("ignores an answer that arrives when nothing is being sent", () => {
      expect(finish({ ok: true }, EDITING)).toBe(EDITING);
    });
  });

  describe("after the message is sent", () => {
    it("goes back to the form when the visitor wants to fix the address", () => {
      expect(reduceMessageState(SENT, { type: "editRequested" })).toEqual(
        EDITING,
      );
    });

    it("does not leave the form for that request while a message is being sent", () => {
      expect(reduceMessageState(SUBMITTING, { type: "editRequested" })).toBe(
        SUBMITTING,
      );
    });
  });
});

describe("findInvalidMessageFields", () => {
  const fields = {
    name: "Jane Doe",
    email: "jane@example.com",
    text: "Hello",
  };

  it("accepts a name, an email, and a message", () => {
    expect(findInvalidMessageFields(fields)).toEqual([]);
  });

  it("rejects every field that is empty or only spaces", () => {
    expect(
      findInvalidMessageFields({ name: " ", email: "", text: " " }),
    ).toEqual(["name", "email", "text"]);
  });

  it("rejects an email that is not shaped like one", () => {
    expect(
      findInvalidMessageFields({ ...fields, email: "jane@company" }),
    ).toEqual(["email"]);
  });
});
