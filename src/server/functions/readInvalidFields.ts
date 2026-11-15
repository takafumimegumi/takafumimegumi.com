/** One problem that a schema found, with the path to the value, such as ["email"]. */
export interface SchemaIssue {
  path: PropertyKey[];
}

/**
 * Names the fields of a request that a schema refused, each once, so the form can mark them.
 * A problem with the request as a whole names no field.
 */
export function readInvalidFields(issues: SchemaIssue[]): string[] {
  const fields = issues.flatMap(({ path }) =>
    path.length > 0 ? [String(path[0])] : [],
  );
  return [...new Set(fields)];
}
