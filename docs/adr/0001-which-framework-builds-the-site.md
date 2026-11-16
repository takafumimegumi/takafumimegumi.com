# ADR-0001: Which framework builds the site?

## Status

Accepted

## Context

Most of the site is static: a one-page home and a privacy page. Only a few routes need server code. They handle form submissions and analytics events.

One feature is harder than the rest. Each case study opens as a full-screen overlay on the home page, and it has its own URL (`/projects/{name}/`):

- Opening it from the home page must not reload the page. The back button closes only the overlay.
- Opening the URL directly shows the home page with the overlay already open.
- Without JavaScript, the URL still shows a readable page.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | Static pages ship little JavaScript | Most visitors read on a phone. The pages must meet the "good" Core Web Vitals thresholds. |
| 2   | The overlay with its own URL can be built cleanly | A case study is a document in its own right. It needs its own title, link preview, and a URL that keeps working. |
| 3   | First-party support for Cloudflare Workers | The site runs on Workers ([ADR-0003](0003-where-is-the-site-hosted.md)). An extra adapter layer is one more thing that can break. |

## Decision

Use Astro. Prerender the static pages at build time, and render only the server routes on demand.

For the overlay, prerender one page per case study URL with the overlay open. On the home page, a small script opens the overlay and updates the URL with the History API.

## Rationale

Astro sends no JavaScript unless a page asks for it, which fits a site that is mostly static. Its Cloudflare adapter targets Workers directly. The overlay is the one place where Astro gives less than the others, and the missing piece is a small amount of standard History API code.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Astro | Static by default | No runtime on static pages. Per-route server rendering. Official Workers adapter. | No built-in feature for an overlay with its own URL (2). The history handling is hand-written. | Chosen |
| Next.js | React framework | Intercepting Routes solve the overlay out of the box. | Ships the React runtime on every page (1). Runs on Workers through the OpenNext adapter, which is being rewritten (3). | Rejected |
| SvelteKit | Svelte framework | Shallow routing solves the overlay. Small output. Official Cloudflare adapter. | Pages hydrate by default, so static pages still ship a runtime and a router (1). I have not used Svelte in production. | Rejected |

## Consequences

- The overlay's URL handling is my own code: `pushState` on open, `popstate` on back, and a prerendered page for direct visits. It needs tests in in-app browsers.
- The home page and each case study URL are built from the same layout, so each needs its own title, link preview, and canonical URL.

## Notes

- Decided: 2026-11-13.
- The overlay was built and checked on 2026-11-14, in Chrome on a desktop and in a browser on a phone: open, back, forward, close, a direct visit, and a reload. In Chrome it was also checked with Escape and without JavaScript. On 2026-11-15 it was checked in the LinkedIn in-app browser on an iPhone: open, back, close, a direct visit, and a reload.
- Astro 7.4 is the current release. Its Cloudflare adapter supports Workers and has deprecated Pages. Checked 2026-11-13: [Astro 7.4](https://astro.build/blog/astro-740/), [adapter docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
- Next.js runs on Workers through OpenNext. The rewritten adapter is expected by the end of 2026. Checked 2026-11-13: [OpenNext](https://opennext.js.org/news/2026-03-25-3-years-of-opennext).
- SvelteKit shallow routing requires JavaScript. Checked 2026-11-13: [SvelteKit docs](https://svelte.dev/docs/kit/shallow-routing).
- Revisit if the hand-written history handling proves unreliable in in-app browsers.
