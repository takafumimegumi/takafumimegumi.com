import type { SendEmail } from "@cloudflare/workers-types";
import { OWNER_EMAIL } from "@/siteConstants";
import { buildFailure, readFailureCode } from "../functions/failureCode";

// Only a sender label. Nothing reads mail at this address.
const FROM_ADDRESS = "contact-form@takafumimegumi.com";

export interface EmailContent {
  /** Shown as the sender in my inbox, such as "Jane Doe (contact form)". */
  senderName: string;
  /** Where my reply goes: the visitor who filled in the form. */
  replyToAddress: string;
  subject: string;
  text: string;
}

/**
 * Emails me through Cloudflare Email Service (ADR-0005).
 * In wrangler.jsonc, the binding allows my address as the only recipient.
 */
export async function sendEmailToOwner(
  binding: SendEmail,
  { senderName, replyToAddress, subject, text }: EmailContent,
): Promise<void> {
  try {
    await binding.send({
      from: { email: FROM_ADDRESS, name: senderName },
      to: OWNER_EMAIL,
      replyTo: replyToAddress,
      subject,
      text,
    });
  } catch (error) {
    // The service puts a code such as "E_DELIVERY_FAILED" on its errors.
    throw buildFailure(
      "cloudflare_email",
      "send_email_to_owner",
      readFailureCode(error) ?? "unknown",
    );
  }
}
