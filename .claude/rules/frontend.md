---
paths:
  - "src/components/**"
  - "src/layouts/**"
  - "src/pages/**/*.astro"
  - "src/scripts/**"
  - "src/styles/**"
---

# Writing frontend code

## Where files go

- `src/pages/` only assembles components. `src/layouts/` owns `<head>` and the global CSS.
- `src/components/sections/` holds components used in one place. `src/components/common/` holds components used in two or more places.
- A component is a folder with its markup, its styles, and its scripts.
- Move a component to `common/` when a second place needs it, not before.
- `src/scripts/` holds scripts that belong to no single component. A script with pure functions of its own is a folder.
- A pure function that another file calls lives in a `functions/` folder next to the code that uses it, in a file named after it.
- Import a file in the same folder with `./`. Import anything else from `@/`, which is `src/`.

## Islands

- An island's folder holds its root component, `api.ts`, and three folders.

| Folder | Holds | May depend on |
| --- | --- | --- |
| `ui/` | Components that draw the props they are given. | `functions/` |
| `hooks/` | State, and the operations that change it. | `functions/`, `api.ts`, and types from `ui/` |
| `functions/` | Pure functions only: state transitions and formatting. | Nothing else in the island, except types from `api.ts` |

- ESLint checks these directions.
- A component in `ui/` that has child components of its own is a folder. Its main file has the folder's name: `BookingPanel/BookingPanel.tsx`.
- Name a component so that it reads without its folder: what it is for, then its shape. `BookingForm`, not `Details`.
- The root component calls the hooks and passes what they return to `ui/`.
- Only `api.ts` calls the server. Its functions do not throw. They return a result.
- What decides the screen is a `status` union in `functions/`, with a pure function that returns the next state. Test that function.
- State that only changes how a component looks, such as which page of a list is shown, stays in the component.
- Do not decide again what the server decides. A form checks only what catches a slip: an empty field, the shape of an email.

## Styles

- Use CSS Modules. One `.module.css` per component, with the same name.
- Name classes after their role, in camelCase: `.root`, `.heading`.
- Do not style the inside of another component. Pass a `class` to it.
- Global CSS is `src/styles/tokens.css` and `src/styles/base.css` only.
- Tokens are the values in the style guide tables. Write other values, such as spacing, directly.
- Color tokens have two layers. The palette names a value: `--forest-9`. A role names a use, element first: `--color-text-accent`, `--color-bg-action`, `--color-border`.
- Use a role for a color that changes with the ground (`data-ground`). Use the palette for a color that stays the same on every ground.
- Add a role when something uses it, not before.
- Shared styles live in the module, so a Preact island can import the same file. The `.astro` file is a thin wrapper.

## State and motion

- Use a native or ARIA state when one exists: `dialog[open]`, `aria-current`, `aria-pressed`.
- Use a `data-*` attribute for the rest. Scripts cannot read hashed class names.
- `base.css` turns transitions off for `prefers-reduced-motion`. Stop a looping animation where it is defined.
- Put a one-off animation inside `@media (prefers-reduced-motion: no-preference)`. `base.css` turns off transitions only.
- Move the focus only after the visitor acts. On page load it would scroll the page.

## Content and scripts

- Render repeated content at build time from a typed array at the top of the component.
- Write visual effects in plain TypeScript. Only UI that holds state and talks to the server is an island (ADR-0002).
- A script runs when an `.astro` file loads it in a `<script>`. It exports only types.
- A script watches the page: the state of the DOM, and the events that components dispatch. Component code does not call a script. ESLint checks this.
- Name a script as verb plus object, after what it does to the page: `revealBlocks.ts`.
- Name a data file as a plural noun: `projects.ts`. It may also export a function that derives a value from its data.
- Keep real links working: do not cancel a click that has a modifier key.
