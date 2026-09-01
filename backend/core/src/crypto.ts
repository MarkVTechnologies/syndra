import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnv } from "./env";

/**
 * AES-256-GCM at-rest encryption for admin-entered integration credentials
 * (Resend/Cloudinary/Paystack/Turnstile keys — see @san/db's
 * integrations.ts). Keyed by ENCRYPTION_KEY, which until now was defined
 * in the env schema but never actually consumed anywhere — this is its
 * first real use.
 *
 * ENCRYPTION_KEY itself stays a plain environment variable, never
 * database-stored: it's the key that unlocks everything stored in the
 * vault, so storing it inside that same vault would be circular.
 */
const IV_LENGTH = 12; // GCM standard nonce size

function getKey(): Buffer {
  const hex = getEnv().ENCRYPTION_KEY;
  return Buffer.from(hex, "hex"); // 32 bytes / 64 hex chars, enforced by the env schema
}

/** Returns `iv:authTag:ciphertext`, each hex-encoded. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptSecret(packed: string): string {
  const [ivHex, authTagHex, ciphertextHex] = packed.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted value");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]);
  return plaintext.toString("utf8");
}

/** For display only — never send a full secret back to the browser. */
export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "••••";
  return `••••${plaintext.slice(-4)}`;
}
