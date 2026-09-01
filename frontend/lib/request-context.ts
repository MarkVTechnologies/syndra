import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { getEnv } from "@san/core/env";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "0.0.0.0";
}

/** PII discipline — IPs are stored as a salted hash for analytics only. PRD §12.4. */
export function hashIp(ip: string): string {
  const env = getEnv();
  return createHash("sha256").update(`${ip}:${env.ATTRIBUTION_SECRET}`).digest("hex");
}
