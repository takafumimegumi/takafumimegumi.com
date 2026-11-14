# ADR-0007: Where are bookings recorded and confirmed?

## Status

Proposed

## Context

A visitor picks a time for a 30-minute video call, and the booking is final at that moment. Confirming a booking means four jobs:

- Show the times that are open.
- Stop two people from taking the same time.
- Create a Google Meet link.
- Tell the visitor the time and the link.

The booking screen is custom-designed, so the solution must work behind my own UI.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | A booking never collides with my real schedule or with another booking | A double booking with a stranger is a bad first impression. |
| 2   | Little personal data, few services, few secrets | Less to leak, and less to explain in the privacy policy. |
| 3   | Works behind the custom booking UI | The designed screen is part of the product. |

## Decision

Use my Google Calendar as the only record of bookings. The Worker calls the Google Calendar API.

- **Open times.** Availability rules (days, hours, minimum notice, how far ahead, buffers) minus the busy times that the free/busy API reports. The rules are personal, so they live in Worker configuration, not in the repository.
- **Booking.** The Worker inserts an event with the visitor as a guest and asks Google to create a Meet link. Google sends the invitation. That invitation is the confirmation email.
- **Race check.** After inserting, the Worker checks the time again. If another booking got there first, it removes the new event and tells the visitor the time was just taken.
- **Access.** An OAuth refresh token for my account, stored as a Worker secret, limited to the free/busy scope and the scope for events on calendars I own.
- **Calls.** Plain `fetch` to the REST API. No Google SDK.
- **Local development** uses a separate test calendar.

## Rationale

The call has to be on my calendar anyway. Making the calendar the record means open times come from my real schedule, and the visitor's name and email are not copied into a second store.

The invitation arrives as a normal calendar invite from my own address. The visitor can add it to any calendar and reply to reach me, which is also how changes and cancellations are handled.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Google Calendar as the record | Free/busy query, then event insert | Real schedule. No database. Google creates the link and sends the invite. | Holds a token that can edit my calendar (2). Check and insert are two steps (1). | Chosen |
| Own store | Slots and bookings in Cloudflare storage | Full control. Atomic booking. | Does not see my other events (1). Stores visitor data and needs paid email sending (2). Cannot create a Meet link without the API. | Rejected |
| Scheduling service API | A hosted scheduler behind my UI | Handles all four jobs. | One more company holds visitor data (2). Emails come under its name. | Rejected |
| Google's booking page | Appointment schedules | No code. | The screen is Google's, not mine (3). | Rejected |

## Consequences

- The refresh token is a powerful secret. If it is revoked or expires, booking stops. The form must show the error and point to the message form.
- Check and insert are not atomic. The race check narrows the window but does not close it.
- The invitation looks like a standard Google invite. Its design is not mine.
- Google delivers the invitation, so I cannot control whether it reaches the inbox.
- The OAuth app must be set to "In production". In "Testing", the token expires after seven days. The app is unverified, so I see a warning once when I grant access.
- A guest who is not signed in to a Google account has to ask to join the call.
- Booking depends on the Google API being up.

## Notes

- Decided: 2026-11-13.
- Tokens for apps in "Testing" expire after seven days. Checked 2026-11-13: [Google Cloud help](https://support.google.com/cloud/answer/15549945?hl=en).
- A service account cannot invite guests without domain-wide delegation, so this uses my own OAuth token. Checked 2026-11-13: [Events: insert](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert).
- Google recommends a new Meet link for every event. Checked 2026-11-13: [release notes](https://developers.google.com/calendar/releases).
- The scopes `calendar.freebusy` and `calendar.events.owned` exist and cover these calls. Checked 2026-11-13: [scopes](https://developers.google.com/workspace/calendar/api/auth). I have not confirmed whether Google classes them as sensitive.
- A guest without a Google account can join by entering a name and asking to join. For meetings organized by a personal account, the organizer or a participant must let them in. Checked 2026-11-13: [Meet help](https://support.google.com/meet/answer/9303069?hl=en&co=GENIE.Platform%3DDesktop). I have not tested this on a device.
- Run from a local script against a personal Google account, 2026-11-13: both scopes were granted, an event with a Meet link and one guest was created, and the invitation came from my own address with my address as the reply-to. It was delivered to a Yahoo! JAPAN mailbox, where it landed in the spam folder.
- Switching the OAuth app to "In production" requires a home page URL and a privacy policy URL. Seen in the Google Cloud console, 2026-11-13.
- I could not confirm whether hosted scheduling services offer API access on a free plan. Their own pages disagree.
- Revisit if double bookings happen, if the token proves fragile, or if guests cannot join calls.
