import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { geolocation } from "@vercel/functions";
import { UAParser } from "ua-parser-js";
import { authenticateWithThrottle, touchLastLogin, recordLogin } from "@san/service-identity";
import { LoginInput } from "@san/core/schemas/auth";
import { authConfig } from "./auth.config";

function deviceLabelFrom(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const ua = new UAParser(userAgent).getResult();
  const browser = ua.browser.name ?? "Unknown browser";
  const os = ua.os.name ?? "Unknown OS";
  return `${browser} on ${os}`;
}

/**
 * Full config — DB-backed Credentials provider (pulls in argon2 + mongoose
 * via @san/service-identity). Used by route handlers, server actions and
 * server components. Never imported from middleware.ts — see auth-edge.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw, request) => {
        const parsed = LoginInput.safeParse(raw);
        if (!parsed.success) return null;

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

        // Brute-force protection: rate limit + progressive lockout + alert
        // email, all before any password check happens. PRD §12.1.
        const result = await authenticateWithThrottle(parsed.data.email, parsed.data.password, ip);
        if (!result.ok) return null;

        await touchLastLogin(result.data.id);

        const userAgent = request.headers.get("user-agent");
        const geo = geolocation(request);
        const geoLabel = geo.city && geo.country ? `${geo.city}, ${geo.country}` : null;

        const sid = await recordLogin({
          userId: result.data.id,
          email: result.data.email,
          ip: ip === "unknown" ? null : ip,
          userAgent,
          deviceLabel: deviceLabelFrom(userAgent),
          geo: geoLabel,
        });

        return {
          id: result.data.id,
          email: result.data.email,
          role: result.data.role,
          sessionVersion: result.data.sessionVersion,
          sid,
        };
      },
    }),
  ],
});
