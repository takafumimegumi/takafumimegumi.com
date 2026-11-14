# ADR-0008: How are page views measured?

## Status

Proposed

## Context

I want a small, specific set of numbers from the site:

- For each page: whether it was opened, when, how long it stayed on screen, and how far it was scrolled.
- Three events: a call was booked, a message was sent, and a case study was opened.
- Which link a visit came from, when the link carries a source tag.

Requests from link-preview fetchers and other automated clients should not count as a page being opened.

The site sets no cookies for measurement. The numbers above do not need to recognize a returning visitor, and without cookies there is no consent banner on the first screen.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | All the numbers above are available | A tool that gives most of them still leaves a second tool to add. |
| 2   | Visit data stays in my own account | The rest of the site stores nothing and adds no outside companies ([ADR-0005](0005-how-are-form-submissions-delivered.md)). |
| 3   | Automated requests are not counted as views | A preview fetch looks like a visit in server logs. |

## Decision

Measure with my own small beacon, stored in Workers Analytics Engine.

- **Opened.** A script sends one beacon when the page becomes visible.
- **Time and scroll.** When the page is hidden or closed, the script sends the visible time and the deepest scroll position with `sendBeacon`.
- **Events.** The same endpoint records the three events.
- **Linking beacons.** Each page load creates a random ID that lives only in memory. It ties the beacons of one view together and is never stored in the browser.
- **Not stored.** No cookies, no local storage for visitors, no IP addresses.
- **My own visits.** A marker in my own browser turns the beacon off.
- **Reading the results.** A report script runs a fixed set of queries against the SQL API.

## Rationale

The numbers are few and exactly defined, so writing them down as code is more certain than fitting them to a product's fixed metrics. The data goes from the visitor's browser to my Worker and into my Cloudflare account, and nowhere else.

Clients that do not run JavaScript, such as link-preview fetchers, never send a beacon. Time on page and scroll depth then separate real reading from the automated clients that do run scripts.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Cloudflare Web Analytics | Cloudflare's free hosted analytics | Nothing to build. No cookies or local storage. | No custom events. Its metrics are visits, page views, load time, and Core Web Vitals, so there is no time on page or scroll depth. Query strings are not logged, so source tags are lost (1). | Rejected |
| Own beacon and Analytics Engine | The decision above | Every number is defined in code. Data stays in my account. | Code to write and maintain. No dashboard. | Chosen |
| Hosted privacy analytics | A paid service such as Plausible | A ready dashboard with events and engagement. | One more company receives visit data (2). A monthly fee. | Rejected |

## Consequences

- There is no dashboard. Results come from the report script or from ad hoc SQL.
- Automated clients that run JavaScript still send beacons. They are told apart by time and scroll, not blocked.
- Visitors with JavaScript turned off are not counted.
- Without a stored ID, the same person visiting twice counts as two views. There is no unique visitor count.
- The privacy page must describe what the beacon sends.

## Notes

- Decided: 2026-11-13.
- Analytics Engine on the Workers Free plan: 100,000 data points written and 10,000 read queries a day. Data is kept for three months. Checked 2026-11-13: [pricing](https://developers.cloudflare.com/analytics/analytics-engine/pricing/), [limits](https://developers.cloudflare.com/analytics/analytics-engine/limits/).
- Analytics Engine is queried through a SQL API. I found no built-in dashboard for it. Checked 2026-11-13: [SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/).
- Cloudflare Web Analytics does not support custom events ("Not yet"), does not log query strings, and uses no cookies or local storage. Its documented metrics are visits, page views, page load time, and Core Web Vitals. Checked 2026-11-13: [FAQ](https://developers.cloudflare.com/web-analytics/faq/), [metrics](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/), [Core Web Vitals](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/).
- Revisit if the fixed queries stop being enough, or if automated clients make the numbers hard to read.
