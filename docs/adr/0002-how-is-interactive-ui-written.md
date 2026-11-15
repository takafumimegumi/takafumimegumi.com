# ADR-0002: How is interactive UI written?

## Status

Accepted

## Context

Astro sends no JavaScript by default ([ADR-0001](0001-which-framework-builds-the-site.md)). Interactive parts can be plain scripts, or components from a UI library that Astro loads as "islands".

The site has two kinds of interactive UI:

- **Visual effects.** Scroll reveals, a counter, a timeline, a logo marquee, a sticky header, and the case study overlay. They hold almost no state.
- **One stateful form.** Booking a call or sending a message. It has eight states, such as sending, done, error, and "that time was just taken", and it talks to the server.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | Little JavaScript, and none that delays the first view | Most visitors read on a phone. |
| 2   | In stateful UI, the state and the screen cannot drift apart, and the UI can be tested | The form is where a visitor acts. A wrong state there costs a booking. |
| 3   | Each tool matches its job, and the rule for choosing is simple | Two styles are fine. Guessing which to use is not. |

## Decision

- Write visual effects and the overlay in plain TypeScript. The overlay uses the native `<dialog>` element.
- Write the form as one Preact island. It loads when it scrolls near the viewport.

The rule: UI that talks to the server and holds state is an island. Everything else is a plain script.

## Rationale

The effects have no state to manage, so a library would add weight and nothing else. The form is the opposite. With eight states and server responses, updating the DOM by hand invites bugs where the state and the screen disagree.

Preact gives the same component model as React in about 3.5 kB, which is in proportion to a single island. The form sits at the bottom of the page, so its code loads late and does not affect the first view.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Plain scripts everywhere | No UI library | Least JavaScript. No dependency. | The form needs a hand-made way to render from state, and is hard to test (2). | Rejected |
| One Preact island | Preact for the form only | Small runtime. Declarative, testable form. Loads late. | Two styles of client code. Small differences from React. | Chosen |
| One React island | React for the form only | Largest ecosystem. Most familiar to readers. | A runtime many times the size of Preact's, for one form that needs nothing only React offers (1). | Rejected |
| Islands everywhere | Effects as components too | One style of client code. | Stateless effects pull in the runtime at first view (1). It gives up the reason for choosing Astro (3). | Rejected |

## Consequences

- Client code is written in two styles. The rule above decides which one to use.
- Some React libraries work with Preact only through `preact/compat`, and not all of them are guaranteed to work.

## Notes

- Decided: 2026-11-13. Accepted: 2026-11-15, after the form was built as an island.
- Preact is about 3.5 kB. Checked 2026-11-13: [Preact project goals](https://preactjs.com/about/project-goals/). React publishes no official size. I have not measured it for this project.
- Measured on the built site, 2026-11-15, gzipped: the island loads about 19 kB of JavaScript. The form's own code is 8.3 kB, Preact 4.6, signals 3.0, Astro's client for Preact 1.6, and hooks 1.3. The form does not use signals, but Astro's client loads them. None of it loads before the form is near the viewport.
- Astro has official integrations for React, Preact, Svelte, Vue, and SolidJS. Checked 2026-11-13: [Astro docs](https://docs.astro.build/en/guides/framework-components/).
- Revisit if the site gains several stateful screens.
