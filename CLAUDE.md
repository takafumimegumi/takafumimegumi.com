# CLAUDE.md

The personal website of Takafumi Megumi. This repository will be public, so write every file and commit as if anyone can read it.

Technical decisions are in `docs/adr/`.

## Language

Write all committed files, comments, and commit messages in English. Use short, plain sentences.

## Code

- Comments explain why, or a constraint the code cannot show. Keep them to 3 lines or fewer.
- Put a constant in the narrowest place that holds every file that uses it: the file itself, `src/server/constants.ts`, or `src/siteConstants.ts`.

## Git

- Commit directly to `main`.
- Commit only after the diff has been approved.
- Push only when instructed. A push to `main` can deploy to production.
- Use Conventional Commits with `feat`, `fix`, `docs`, or `chore`. The body says what changed and why.
- Keep the `Co-Authored-By` trailer for Claude.
