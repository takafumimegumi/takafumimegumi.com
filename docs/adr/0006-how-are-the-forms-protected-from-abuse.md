# ADR-0006: How are the forms protected from abuse?

## Status

Accepted

## Context

The booking form and the message form are public, so anyone can post to them, including scripts. A booking makes Google send a calendar invitation to the address that was entered ([ADR-0007](0007-where-are-bookings-recorded-and-confirmed.md)).

Three kinds of abuse matter here:

- **Spam.** Automated messages fill my inbox.
- **Relayed email.** Someone enters another person's address, and that person gets an email because of this site.
- **Slot filling.** Someone books every open time so real visitors cannot.

The code is public. A defense that works only while it is hidden is not a defense.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | Defenses hold when the attacker has read the code | The repository is public. |
| 2   | Real visitors are not slowed down | Booking a call is the main action on the site. |
| 3   | No new stored data, and few new services | The site stores nothing ([ADR-0005](0005-how-are-form-submissions-delivered.md)). |

## Decision

Use server-verified checks, and limit what a successful submission can do.

- **Bot check.** Both forms carry a Cloudflare Turnstile token. The Worker verifies it before it sends or books anything.
- **Rate limit.** The Workers rate limiting binding stops bursts from one client.
- **No email to typed addresses from the message form.** The screen confirms that a message was sent. There is no automatic reply.
- **Invitation content.** The invitation has a fixed title. The visitor's name and free text go only to me, and are never included in it.

## Rationale

Turnstile and the rate limit are checked on the server, so reading the code does not help an attacker pass them. Turnstile usually passes without any action from the visitor.

The other rules limit the damage that gets through. A person acting by hand can only cause plain invitations, with no content of their choosing. Every booking emails me, so I notice.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Honeypot and timing checks only | No third-party script | Nothing external. Invisible to visitors. | Anyone who reads the code can skip it (1). | Rejected |
| Server-verified checks | The decision above | Holds when the code is known. No extra step for visitors. | Loads one third-party script. Cannot stop slow abuse by hand. | Chosen |
| Server-verified checks plus booking caps | Also limit bookings per day and per email address | Bounds slow abuse by hand. | Needs an extra read of the calendar to count bookings. Not needed until such abuse happens. | Rejected |
| Server-verified checks plus email verification | Also send a code to the address before confirming a booking | Fully stops invitations to other people's addresses. | Adds a step to the main action (2). Needs a service that can email any address (3). | Rejected |

## Consequences

- A person submitting by hand is not stopped, and there is no cap on the number of bookings.
- Turnstile uses cookies and browser storage that Cloudflare describes as strictly necessary for bot detection. The privacy page must say so.
- The rate limit is approximate and counted per Cloudflare location. It stops bursts, not precise quotas.
- A visitor who sends a message gets no email copy of it.

## Notes

- Decided: 2026-11-13.
- Turnstile is free with unlimited verifications, and server-side validation is required. Checked 2026-11-13: [plans](https://developers.cloudflare.com/turnstile/plans/), [overview](https://developers.cloudflare.com/turnstile/).
- Turnstile's use of cookies. Checked 2026-11-13: [Turnstile privacy addendum](https://www.cloudflare.com/turnstile-privacy-policy/).
- The rate limiting binding is generally available, with a 10 or 60 second period. Checked 2026-11-13: [docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/). I could not find its price on the pricing page.
- Revisit if spam gets through in volume, or if visitors report trouble passing the bot check. Add booking caps if abuse by hand creates bookings.
