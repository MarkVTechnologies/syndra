import { cookies } from "next/headers";

/** R4 — 90 days, SameSite=Lax, refreshed on every microsite visit. PRD §3.3. */
export const SAN_REF_COOKIE = "san_ref";
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export async function setReferralCookie(ambassadorId: string): Promise<void> {
  const store = await cookies();
  store.set(SAN_REF_COOKIE, ambassadorId, {
    httpOnly: false, // needed by the client form per PRD §3.3
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function getReferralCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(SAN_REF_COOKIE)?.value ?? null;
}
