# ADR-0004: How does a change reach production?

## Status

Proposed

## Context

The site runs on one Cloudflare Worker ([ADR-0003](0003-where-is-the-site-hosted.md)). I commit straight to `main`.

The site keeps no database ([ADR-0005](0005-how-are-form-submissions-delivered.md)). Bookings live in a calendar and messages go to an inbox, so there is no production data that a test could damage.

The repository is public, and so are its workflow logs.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | Only code that passed the checks reaches production | A broken form costs a booking. |
| 2   | The pipeline is in the repository and can be read | The deploy process should be repeatable, and its history tracked. |
| 3   | Few secrets and configurations to keep | Each copy is one more thing to leak or to drift. |

## Decision

Deploy with GitHub Actions to a single environment.

- **Deploy on push.** A push to `main` runs the checks. If they pass, the same workflow deploys to production.
- **Verify locally first.** For the few things a local run cannot reproduce (the real bot check, real email, in-app browsers), upload a version and open its Version URL before pushing.
- **Before launch**, the site is served only on its `workers.dev` URL, behind Cloudflare Access. At launch, the custom domain is attached and the `workers.dev` URL is turned off.
- **Deploy token.** It lives in GitHub Actions secrets and can deploy only this Worker.

## Rationale

GitHub Actions keeps the pipeline in the repository as code, and "deploy only if the checks pass" is an explicit job dependency.

A staging environment would double the configuration and secrets to protect data that does not exist. A Version URL runs the exact version that will ship, with the production settings, so what is tested is what goes live.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| GitHub Actions, one environment | Checks, then deploy to production | Pipeline as code. Explicit gate. One set of secrets. | Deploy token is stored in GitHub. Logs are public. | Chosen |
| GitHub Actions, with staging | Deploy to a second Worker first | Configuration changes can be tested apart from production. | A second set of configuration and secrets, with no data to protect (3). The two can drift. | Rejected |
| Workers Builds | Cloudflare builds and deploys on push | Deploy token stays inside Cloudflare. Logs are private. | Most of the setup lives in a dashboard, not in the repository (2). | Rejected |
| Manual deploy | Run the deploy command locally | Nothing to set up. | Nothing enforces the checks (1). | Rejected |

## Consequences

- A test booking made through a Version URL is real. It uses the production secrets.
- Workflow logs are public. The checks must not call real services or print response bodies.
- A bug that only shows on a real device can reach production if the Version URL check is skipped. Workers can roll back to the previous version.

## Notes

- Decided: 2026-11-13.
- `wrangler versions upload` uploads a version without deploying it and returns its Version URL. Version URLs are not created for Workers that use Durable Objects. Checked 2026-11-13: [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/).
- Cloudflare Access can protect `workers.dev` and Version URLs, and is free for up to 50 users. Checked 2026-11-13: [Workers docs](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Access](https://www.cloudflare.com/sase/products/access/).
- GitHub Actions standard runners are free for public repositories. Checked 2026-11-13: [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
- Revisit if the site starts to store data, if it needs Durable Objects, or if work moves to pull requests. Per-branch Worker Previews would fit a pull request workflow.
