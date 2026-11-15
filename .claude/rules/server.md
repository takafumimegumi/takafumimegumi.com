---
paths:
  - "src/server/**"
  - "src/pages/api/**"
---

# Writing server code

## Where code goes

`src/server/` has three folders, split by what the code may depend on.

| Folder | Holds | May depend on |
| --- | --- | --- |
| `usecases/` | What the server can do. One use case per file. | `functions/`, and types from `clients/` |
| `functions/` | Pure functions only: calculations and validation whose result depends only on the input. | Nothing else in `src/server/` |
| `clients/` | Code that calls an external API. | `functions/` |

- ESLint checks these directions. Every folder may use `src/server/types.ts` and `src/server/constants.ts`.
- A type lives in the file of the function when only that function takes or returns it. A type that two or more functions take or return lives in `src/server/types.ts`.
- A route in `src/pages/api/` only assembles. It reads configuration and secrets, passes the implementations from `clients/` to a use case, and maps the result to a status code.
- A use case takes the functions that call external APIs as arguments. It does not import an implementation from `clients/`.
- Put the schema for a request in the use case file that receives the request.
- A use case names the value it receives `rawRequest`, and the value that passed the schema `request`.
- A use case file exports only the use case.
- A route catches every error, reports it with `reportFailure`, and returns a 500. It never lets an error reach Astro, which logs the error's message.
- What two or more routes share lives in `src/pages/api/_route.ts`, such as catching errors, the `no-store` response, and reading the body. Binding dependencies to a use case stays in each route.

## Clients

- A file exports its operations as functions. An operation that needs a binding takes it as its first argument. An operation that needs secrets takes them as its first argument, in an object named `config`, so two strings cannot be swapped.
- Order a file as constants, the exported operations, then helpers. Put a type just before the first function that uses it. Keep every function at the top level of the file, not nested inside another.
- When two or more operations in a file share the code that talks to the service, move that code to `<service>Request.ts`. Only that client imports it.
- Code that two or more clients share for talking to a service lives in `clients/httpRequest.ts`.
- Arguments and return values use this site's words, and each of their types has a name. The API's own words stay inside the file.
- A client does not decide what a result means. It returns what the API said, or throws.
- Give every `fetch` a timeout. Throw a failure as an error with a `code` of the form `service:operation:detail`, made with `buildFailure`. The code is reported, so nothing a visitor typed goes into it.

## Naming

- Name a use case file as verb plus object, the same as the function in it: `createBooking.ts` holds `createBooking`.
- Name a file in `clients/` after the service it calls: `googleCalendar.ts`, `sentry.ts`.
- A file in `functions/` exports one function and is named after it: `computeOpenSlots.ts`.
- Name a use case, and an operation that a client exports, as verb plus object.
  - For something that is stored, use a CRUD verb: `create`, `list` (returns many), `find` (looks for one), `update`, `delete`.
  - For any other action, use the verb for that action: `send`, `verify`, `check`, `report`, `request`. Add a verb only when none of these fits.
- Start every other function name with a verb. Start one that returns a boolean with `is` or `has`.
- Make the object a noun, and use the word the ADRs and the screen use: `createBooking`, `listBusyTimes`. No adjectives or abbreviations.
- Write a file name of several words in camelCase.

## Logic

- Take the current time as an argument.
- Return an expected outcome as a discriminated union, such as `{ ok: false, reason: "taken" }`. Let an unexpected failure throw. The route turns it into a 500.
- Calculate times with the fixed UTC-7 offset. Do not use `Intl` or a time zone library on the server.

## Bindings

- After adding a binding to `wrangler.jsonc`, run `npm run types`, then add the binding's type name to `src/env.d.ts`. Without that line the binding on `env` silently becomes `any`.

## Tests

- Test `usecases/` and `functions/`. Put the test next to the file, as `name.test.ts`.
- Pass `vi.fn()` for each external call. No test reaches a real service.
- Write a boundary in a calculation as a pair: the exact value, and one step past it.
- Test only the rules a schema adds itself. Do not test what Zod already checks, such as `.max()` or `z.email()`.
- Do not test `clients/`. Check them against the real service.
- Do not put real availability rules, addresses, or secrets in a test.

## Privacy

- Do not write form input to logs or failure reports. Record the kind of failure and where it happened.
