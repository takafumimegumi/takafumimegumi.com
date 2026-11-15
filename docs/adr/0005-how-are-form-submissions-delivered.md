# ADR-0005: How are form submissions delivered?

## Status

Accepted

## Context

The site has two forms. One books a call, and one sends me a message. Each submission carries a name, an email address, and sometimes free text.

This record covers where a submission is received and where its content ends up. Abuse is covered in [ADR-0006](0006-how-are-the-forms-protected-from-abuse.md), and the booking itself in [ADR-0007](0007-where-are-bookings-recorded-and-confirmed.md).

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | The site keeps as little personal data as possible | Data that is not stored cannot leak, and needs no retention rule. |
| 2   | Few companies handle visitor data | Each one has to be named in the privacy policy. |
| 3   | A submission is not silently lost | A lost message is a lost conversation. |

## Decision

Receive both forms in server routes on the same Worker, and store nothing.

- **Message.** The Worker emails it to my own verified address, with the sender set as the reply-to. I answer from my inbox.
- **Booking.** The Worker creates a calendar event. The calendar is the record. The Worker also emails me the visitor's name and what they want to talk about, which the invitation leaves out ([ADR-0006](0006-how-are-the-forms-protected-from-abuse.md)).

## Rationale

Both destinations are places where the content has to end up anyway: my inbox and my calendar. A database in between would hold a second copy of names, email addresses, and messages, and that copy would need a retention rule, a deletion process, and protection.

Sending email to my own verified address is free on Cloudflare and needs no outside email provider.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Email only, no storage | Worker route, then inbox or calendar | No visitor data at rest on the site. No extra company. | If the email fails, the message is gone (3). | Chosen |
| Store, then notify | Save to a database, then email | Nothing is lost. Failed emails can be retried. | Holds personal data, which needs retention and deletion rules (1). | Rejected |
| Third-party form service | Post the forms to a hosted service | No server code. Keeps a copy. | One more company holds visitor data (2). It cannot run the booking logic. | Rejected |

## Consequences

- If the email to me fails, the message is lost. The form must show the error and offer my email address as a fallback.
- If the email about a booking fails, the booking still stands. I see the event on my calendar, without the name or the topic.
- My inbox and calendar are the only records. There is no list of submissions on the site.
- A mistyped email address in a message goes unnoticed until I reply and it bounces.

## Notes

- Decided: 2026-11-13.
- Sending to a verified destination address is free on Cloudflare. Sending to any address needs the Workers Paid plan. Checked 2026-11-13: [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/).
- The send binding accepts a reply-to address. Sent from the Worker, 2026-11-14.
- The sender's domain must be onboarded to Email Routing, even when the only recipient is my own verified address. Before that, the send failed with `E_SENDER_DOMAIN_NOT_CONFIGURED`. Seen 2026-11-14.
- Revisit if messages are lost in practice.
