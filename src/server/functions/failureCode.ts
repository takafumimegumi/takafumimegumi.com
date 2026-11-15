/**
 * Builds the error that a failed call throws. Its code names the place and the kind.
 * The code is what gets reported, so it must never contain anything a visitor typed.
 */
export function buildFailure(
  service: string,
  operation: string,
  detail: string,
): Error {
  const code = `${service}:${operation}:${detail}`;
  return Object.assign(new Error(code), { code });
}

/** Reads the code from an error that carries one. */
export function readFailureCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : undefined;
}
