# ADR-0003: Where is the site hosted?

## Status

Proposed

## Context

The site is mostly static, with a few server routes ([ADR-0001](0001-which-framework-builds-the-site.md)). Besides hosting, it needs rate limiting, a bot check, and a way to send email to me.

The repository is public, so every extra API key is one more thing that can leak.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | The pieces the site needs are on one platform, with few credentials between them | Fewer secrets to manage in a public repository. |
| 2   | Static pages are fast, and the cost is predictable | Most requests are for static files. |
| 3   | Little to assemble and operate | It is a small site run by one person. |

## Decision

Host on Cloudflare Workers. Static files are served as Workers static assets, and the Worker runs only for the server routes. Secrets are stored as Worker secrets.

## Rationale

On Cloudflare, rate limiting and email sending are bindings on the same platform, so the code reaches them without API keys. The bot check is from the same vendor and needs one secret. Requests for static files are free and do not run the Worker. The domain's DNS is already on Cloudflare, so hosting and DNS stay in one place.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Cloudflare Workers | Edge runtime with bindings | Rate limiting, email sending, and bot check on one platform. Static requests are free. DNS already there. | Not Node.js, so some npm packages do not run. Free plan allows 10 ms of CPU per request. Bindings are Cloudflare-specific. | Chosen |
| Cloudflare Pages | Cloudflare's older hosting product | Same platform and bindings. | Cloudflare directs new projects to Workers, and the Astro adapter has deprecated Pages (3). | Rejected |
| Vercel | Hosting with serverless functions | Official Astro support. Node.js runtime. | Hobby plan is limited to personal, non-commercial use (2). Hosting and DNS would be in two places (3). | Rejected |
| Netlify | Hosting with serverless functions | Official Astro support. Built-in form handling. | Free plan has 300 credits a month and a production deploy costs 15, so about 20 deploys a month (2). | Rejected |
| AWS | S3, CloudFront, and Lambda | Fewest limits. | Hosting, functions, and permissions are assembled by hand (3). | Rejected |

## Consequences

- Code must run on the Workers runtime. Libraries that need Node.js APIs may not work.
- Heavy server work, such as generating a PDF on request, does not fit in the CPU limit.
- Moving off Cloudflare means rewriting the code that uses bindings.

## Notes

- Decided: 2026-11-13.
- Workers Free plan: 100,000 requests a day, 10 ms CPU per request, static asset requests free and unlimited. Checked 2026-11-13: [pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits/).
- Cloudflare recommends Workers over Pages for new projects. Checked 2026-11-13: [best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
- Vercel Hobby and Netlify Free terms. Checked 2026-11-13: [Vercel](https://vercel.com/docs/limits/fair-use-guidelines), [Netlify](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).
- I did not compare rate limiting and email products on Vercel and Netlify in detail.
- Revisit if the site needs server work that does not fit the Workers limits.
