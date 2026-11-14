---
paths:
  - "src/server/**"
  - "src/pages/api/**"
---

# Writing server code

## Where code goes

- A route in `src/pages/api/` only assembles. It reads configuration and secrets, passes the real implementations to a workflow, and maps the result to a status code.
- Logic lives in `src/server/`. A file that only calls an external service holds no decisions.

## Logic

- Write a calculation whose result depends only on its input as a pure function. Take the current time as an argument.
- A workflow takes the functions that call external services as arguments.
- Return an expected outcome as a discriminated union, such as `{ ok: false, reason: "taken" }`. Let an unexpected failure throw. The route turns it into a 500.
- Calculate times with the fixed UTC-7 offset. Do not use `Intl` or a time zone library on the server.

## Tests

- Test pure functions and workflows. Put the test next to the file, as `name.test.ts`.
- Pass `vi.fn()` for each external call. No test reaches a real service.
- Write a boundary as a pair: the exact value, and one step past it.
- Do not test a file that only calls an external service. Check it against the real service.
- Do not put real availability rules, addresses, or secrets in a test.

## Privacy

- Do not write form input to logs or failure reports. Record the kind of failure and where it happened.
