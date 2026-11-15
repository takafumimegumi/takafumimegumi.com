import { z } from "astro/zod";
import type { EmailContent } from "../clients/cloudflareEmail";
import type { RateLimitCheck } from "../clients/cloudflareRateLimit";
import { isTokenAccepted } from "../functions/isTokenAccepted";
import { readInvalidFields } from "../functions/readInvalidFields";
import type { TokenCheck } from "../types";

const messageRequestSchema = z.object({
  // One line only: the name goes into the sender and the subject of the email to me.
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^\P{Cc}*$/u),
  email: z.string().trim().pipe(z.email().max(254)),
  text: z.string().trim().min(1).max(5000),
  // 2048 is the longest token Turnstile issues.
  token: z.string().min(1).max(2048),
});

type MessageRequest = z.infer<typeof messageRequestSchema>;

interface SendMessageDependencies {
  checkRateLimit: () => Promise<RateLimitCheck>;
  verifyToken: (token: string) => Promise<TokenCheck>;
  sendEmailToOwner: (email: EmailContent) => Promise<void>;
}

type SendMessageResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; fields: string[] }
  | { ok: false; reason: "rate_limited" | "unverified" };

/**
 * Sends me a visitor's message by email, with the visitor as the reply-to (ADR-0005).
 * Nothing is stored and the visitor gets no email, so a failed send throws: the message is lost.
 */
export async function sendMessage(
  dependencies: SendMessageDependencies,
  rawRequest: unknown,
): Promise<SendMessageResult> {
  const rateLimit = await dependencies.checkRateLimit();
  if (!rateLimit.allowed) return { ok: false, reason: "rate_limited" };

  const parsed = messageRequestSchema.safeParse(rawRequest);
  if (!parsed.success) {
    const fields = readInvalidFields(parsed.error.issues);
    return { ok: false, reason: "invalid", fields };
  }
  const request = parsed.data;

  const tokenCheck = await dependencies.verifyToken(request.token);
  if (!isTokenAccepted(tokenCheck, "message")) {
    return { ok: false, reason: "unverified" };
  }

  await dependencies.sendEmailToOwner(buildMessageEmail(request));

  return { ok: true };
}

function buildMessageEmail(request: MessageRequest): EmailContent {
  return {
    senderName: `${request.name} (contact form)`,
    replyToAddress: request.email,
    subject: `Message from ${request.name}`,
    text: [request.text, "", `${request.name} <${request.email}>`].join("\n"),
  };
}
