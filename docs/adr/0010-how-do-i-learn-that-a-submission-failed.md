# ADR-0010: How do I learn that a submission failed?

## Status

Accepted

## Context

The forms store nothing ([ADR-0005](0005-how-are-form-submissions-delivered.md)). A booking depends on Google, and a message depends on email sending. When either fails, the visitor sees an error on the screen, but nothing reaches me. For a message, the content itself is lost.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | An alert reaches me whatever kind of failure it was | A failure I do not notice is a lost conversation. |
| 2   | No visitor data goes to another company | Each company that receives it has to be named in the privacy policy. |
| 3   | No JavaScript is added to the first view | Most visitors read on a phone. |

## Decision

Report failures to Sentry, from the server only. A report carries where the failure happened and what kind it was. Sentry emails me.

- **Explicit reports.** The code sends each report. Everything the SDK collects on its own is turned off: the request, headers, cookies, and IP address.
- **No third-party error messages.** A message returned by an outside service can echo what a visitor typed, so it is never sent.
- **One issue per place and kind.** A new kind of failure opens a new issue, which raises a new alert.
- **No SDK in the browser.**

## Rationale

The alert travels on a path that is separate from both things that can fail: Google and email sending. Emailing myself about a failure would go silent exactly when email sending is what failed.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Worker logs only | Failures are written to the logs | Nothing to add. | I learn of a failure only if I look (1). | Rejected |
| Email myself | The Worker emails me when something fails | No new company or dependency. | No alert when email sending fails, which is when a message is lost (1). | Rejected |
| Sentry, server only | The decision above | Covers every server-side failure. Independent of Google and email sending. | One more company and one more dependency. | Chosen |

## Consequences

- One more company is involved. It receives no visitor data.
- Two failures raise no alert: a script error in the browser that stops the form from submitting, and the bot check turning away a real visitor.
- A repeat of the same kind of failure joins its existing issue. I have not confirmed whether that sends another alert.
- A later SDK version may collect more by default. The code also strips those fields just before sending.
- Sentry records a rough location for each report. It is where the Worker ran, not where the visitor is.

## Notes

- Decided: 2026-11-14.
- By default the SDK sends request headers, cookies, bodies, and the IP address. Checked 2026-11-14: [data collected](https://docs.sentry.io/platforms/javascript/guides/cloudflare/data-management/data-collected/).
- Reported from the Worker, 2026-11-14: the request and user fields were empty, two kinds of failure opened two issues, and the alert arrived by email.
- The free plan includes one user, 5,000 errors, and email alerts. Checked 2026-11-14: [pricing](https://sentry.io/pricing/). The page does not say what period the 5,000 covers.
- Revisit if a failure goes unnoticed, or if the free quota is exceeded.
