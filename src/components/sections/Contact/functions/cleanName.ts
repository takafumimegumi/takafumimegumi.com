/** Turns control characters, such as a pasted tab, into spaces. The server refuses a name that has one. */
export function cleanName(name: string): string {
  return name.replace(/\p{Cc}+/gu, " ").trim();
}
