# ADR-0009: Where are secrets and private text stopped?

## Status

Accepted

## Context

The repository is public, and so are its workflow logs. Once something is pushed, copies can survive even if it is deleted later.

Two kinds of content must stay out of git:

- **Secrets.** The deploy token and the keys the Worker uses.
- **Private text.** Personal details and names from unrelated private work. It has no fixed format, so ready-made rules cannot find it.

One person works on the repository, from one clone, and pushes straight to `main` ([ADR-0004](0004-how-does-a-change-reach-production.md)). The repository stays private until the site launches.

## Criteria

| #   | Criterion | Why it matters |
| --- | --------- | -------------- |
| 1   | Content is stopped before it becomes public | Afterwards, a secret has to be revoked, and text has to be rewritten out of the history. |
| 2   | The list of private text never appears in the repository or in logs | Publishing the list would be the leak. |
| 3   | Little to maintain | One person maintains it. |

## Decision

Stop them in two places: a local pre-push hook, and GitHub push protection. CI runs no scan.

- **Local hook.** It reads the diffs, commit messages, and file names of the commits being pushed. It blocks the push if they contain a term from a list kept outside git, or a value from the local `.dev.vars` file. `npm install` turns the hook on.
- **Push protection.** GitHub rejects a push that contains a secret with a known format. It works on pushes to public repositories.
- **Before going public.** The whole history is scanned once with a secret scanner.

## Rationale

The list can only live on my machine, so matching against it can only happen there. Values from `.dev.vars` go through the same check, which does not depend on what a secret looks like.

Finding secrets by their format is left to GitHub. Push protection rejects a push before accepting it, covers the Cloudflare and Google credentials this site uses, and has rules that GitHub keeps current. A local scanner would do the same job with one more tool to install and one more rule set to go stale.

## Alternatives

| Option | Summary | Pros | Cons | Result |
| ------ | ------- | ---- | ---- | ------ |
| Local hook and push protection | The decision above | Stops content before it is public. The list stays local. One script to keep. | No format-based detection while the repository is private. A push that skips the hook is not matched against the list. | Chosen |
| Local hook with a secret scanner | The hook also runs a scanner | Format-based detection while private too. | One more tool and rule set to maintain (3). Overlaps with push protection once public. | Rejected |
| Scan in CI | Scan the history on every push | Cannot be skipped. | Finds content after it is out (1). Cannot use the list (2). | Rejected |
| Push protection only | No local check | Nothing to maintain. | Cannot check private text. Misses secrets with no fixed format. | Rejected |

## Consequences

- While the repository is private, push protection does not run. A secret that is not in `.dev.vars` goes unnoticed until the scan before going public.
- A push with `--no-verify`, or from a clone where the hook is off, is not matched against the list.
- Terms that are not on the list, and rewordings of them, are not found.
- A secret with no fixed format that is not in `.dev.vars` is not found anywhere. The Turnstile secret is one. Production values are entered directly into Cloudflare and never written to a file.

## Notes

- Decided: 2026-11-13.
- Push protection blocks a push before it reaches the repository, and is on by default for pushes to public repositories. Checked 2026-11-13: [about push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection).
- Its supported formats include Cloudflare API tokens, and Google OAuth client secrets and refresh tokens. The Turnstile secret is not listed. Checked 2026-11-13: [supported patterns](https://docs.github.com/en/code-security/secret-scanning/introduction/supported-secret-scanning-patterns).
- Tested 2026-11-13 in a separate repository. Clean commits were pushed. A listed term in a file, a commit message, or a file name blocked the push, and so did a `.dev.vars` value and a missing list.
- Revisit if someone else joins, if work moves to pull requests, or if the repository stays private for long.
