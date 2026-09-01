import type { NextAuthConfig } from "next-auth";

/**
 * Edge/middleware-safe half of the NextAuth config — no providers, no DB,
 * no native modules (argon2, mongoose). middleware.ts imports this via
 * auth-edge.ts to check role/session from the JWT cookie alone. The full
 * config (auth.ts) adds the Credentials provider's DB-backed authorize()
 * and is used everywhere else (route handlers, server actions, server
 * components). This split is the standard NextAuth v5 pattern for a
 * database-backed provider — Next's middleware bundler can't handle a
 * native .node binary regardless of runtime target.
 */
export const authConfig: NextAuthConfig = {
  // Auth.js only auto-trusts the request host on Vercel (it special-cases
  // the VERCEL env var); every other host, Netlify included, throws
  // UntrustedHost on every session/callback request unless this is set
  // explicitly — documented Auth.js requirement for non-Vercel deploys.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
        token.sid = user.sid;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "admin" | "ambassador" | "syndicator";
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.sid = token.sid as string;
      }
      return session;
    },
  },
};
