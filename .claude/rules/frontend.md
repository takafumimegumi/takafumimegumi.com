---
paths:
  - "src/**"
---

# Writing frontend code

## Where files go

- `src/pages/` only assembles components. `src/layouts/` owns `<head>` and the global CSS.
- `src/components/sections/` holds components used in one place. `src/components/common/` holds components used in two or more places.
- A component is a folder with its markup, its styles, and its scripts.
- Move code to `common/` or `src/scripts/` when a second place needs it, not before.

## Styles

- Use CSS Modules. One `.module.css` per component, with the same name.
- Name classes after their role, in camelCase: `.root`, `.heading`.
- Do not style the inside of another component. Pass a `class` to it.
- Global CSS is `src/styles/tokens.css` and `src/styles/base.css` only.
- Tokens are the values in the style guide tables. Write other values, such as spacing, directly.
- Shared styles live in the module, so a Preact island can import the same file. The `.astro` file is a thin wrapper.

## State and motion

- Use a native or ARIA state when one exists: `dialog[open]`, `aria-current`, `aria-pressed`.
- Use a `data-*` attribute for the rest. Scripts cannot read hashed class names.
- `base.css` turns transitions off for `prefers-reduced-motion`. Stop a looping animation where it is defined.

## Content and scripts

- Render repeated content at build time from a typed array at the top of the component.
- Write visual effects in plain TypeScript. Only UI that holds state and talks to the server is an island (ADR-0002).
- Keep real links working: do not cancel a click that has a modifier key.
