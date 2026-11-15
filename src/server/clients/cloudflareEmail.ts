import type { SendEmail } from "@cloudflare/workers-types";
import { OWNER_EMAIL } from "@/siteConstants";

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
 * Emails me through Cloudflare Email Service (ADR-0005). In wrangler.jsonc, the binding allows
 * my address as the only recipient. A failed send throws with a code such as "E_DELIVERY_FAILED".
 */
export async function sendEmailToOwner(
  binding: SendEmail,
  { senderName, replyToAddress, subject, text }: EmailContent,
): Promise<void> {
  await binding.send({
    from: { email: FROM_ADDRESS, name: senderName },
    to: OWNER_EMAIL,
    replyTo: replyToAddress,
    subject,
    text,
  });
}
