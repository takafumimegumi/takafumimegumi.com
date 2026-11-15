/**
 * True for text shaped like an email address: something, an @, and a domain with a dot.
 * The server makes the real check. This one only catches a slip before sending.
 */
export function isEmailLike(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}
