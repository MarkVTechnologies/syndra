/**
 * Escapes regex metacharacters in a user-supplied search string before it's
 * used in a MongoDB $regex filter — prevents ReDoS (a crafted pattern like
 * `(a+)+$` causing catastrophic backtracking) and stray metacharacter
 * behavior. PRD §12.3 "NoSQL / Injection" control, applied at every search
 * input that builds a $regex filter from raw user text.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
