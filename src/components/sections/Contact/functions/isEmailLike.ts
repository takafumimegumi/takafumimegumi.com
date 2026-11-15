/** Only catches a slip before sending: something, an @, and a domain with a dot. The server makes the real check. */
export function isEmailLike(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}
