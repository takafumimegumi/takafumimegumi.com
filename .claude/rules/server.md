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
| `clients/` | Code that calls an external API. | Nothing else in `src/server/` |

- A route in `src/pages/api/` only assembles. It reads configuration and secrets, passes the implementations from `clients/` to a use case, and maps the result to a status code.
- A use case takes the functions that call external APIs as arguments. It does not import an implementation from `clients/`.
- A client does not decide what a result means. It returns what the API said, or throws.

## Naming

- Name a use case file as verb plus object, the same as the function in it: `bookCall.ts` holds `bookCall`.
- Name a file in `clients/` after the service it calls: `googleCalendar.ts`, `sentry.ts`.
- Start every function name with a verb: `computeOpenSlots`, `findBusy`.
- Write a file name of several words in camelCase.

## Logic

- Take the current time as an argument.
- Return an expected outcome as a discriminated union, such as `{ ok: false, reason: "taken" }`. Let an unexpected failure throw. The route turns it into a 500.
- Calculate times with the fixed UTC-7 offset. Do not use `Intl` or a time zone library on the server.

## Tests

- Test `usecases/` and `functions/`. Put the test next to the file, as `name.test.ts`.
- Pass `vi.fn()` for each external call. No test reaches a real service.
- Write a boundary as a pair: the exact value, and one step past it.
- Do not test `clients/`. Check them against the real service.
- Do not put real availability rules, addresses, or secrets in a test.

## Privacy

- Do not write form input to logs or failure reports. Record the kind of failure and where it happened.
