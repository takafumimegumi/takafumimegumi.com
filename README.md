# takafumimegumi.com

Source code for [takafumimegumi.com](https://takafumimegumi.com), the personal website of Takafumi Megumi, a product engineer based in Vancouver. The site shows who I am, what I have built, and how to reach me.

This site is being rebuilt from scratch.

## Development

The site is built with [Astro](https://astro.build) and runs on Cloudflare Workers. It needs the Node.js version in the `volta` field of `package.json`.

```sh
npm install
npm run dev
```

Run every check with one command. It checks formatting, lints, type-checks, and builds the site.

```sh
npm run check
```

`npm run format` fixes formatting. A push to `main` runs the same checks and then deploys ([ADR-0004](docs/adr/0004-how-does-a-change-reach-production.md)).

Before a push, a git hook checks the commits against a local list of text that must not be published ([ADR-0009](docs/adr/0009-where-are-secrets-and-private-text-stopped.md)).

## How this is built

I plan the product, make the design and technical decisions, and review the changes. I use Claude Code for implementation. Technical decisions are recorded in [docs/adr](docs/adr/README.md).

## Contact

Issues are turned off for this repository. To reach me, use the contact options on the website.

## License

All rights reserved. No license is granted to reuse the code or content.
