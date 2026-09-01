import { randomBytes, createHash, randomUUID } from "node:crypto";

/** Cryptographically random, hashed at rest, single-use. PRD §12.1. */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionId(): string {
  return randomUUID();
}
