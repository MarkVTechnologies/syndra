import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth-edge";
import { getCachedSessionVersion, isSessionRevoked } from "@san/service-identity/session-cache";

const ROLE_PREFIXES: Record<string, "admin" | "ambassador" | "syndicator"> = {
  "/admin": "admin",
  "/dashboard": "ambassador",
  "/portfolio": "syndicator",
};

const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

function buildCsp(nonce: string): string {
  // Next.js's dev-mode Fast Refresh / HMR client runtime evaluates code via
  // eval() — without 'unsafe-eval' here, that throws inside main-app.js on
  // every page load, which means the client bundle never finishes
  // executing and NOTHING hydrates: every "use client" component (forms,
  // Framer Motion, dropdowns) sits frozen at its server-rendered initial
  // state with no visible error beyond a console exception. Production
  // builds don't use eval-based HMR, so the strict, eval-free policy (PRD
  // §12.6 check #12) applies there unchanged — this widening is dev-only.
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // script-src has NO unsafe-inline/unsafe-eval in production — nonce +
    // strict-dynamic only. PRD §12.6 check #12 pass criteria.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "img-src 'self' data: res.cloudinary.com",
    "connect-src 'self' *.upstash.io *.sentry.io challenges.cloudflare.com",
    // KNOWN TRADE-OFF: style-src keeps 'unsafe-inline'. React's `style={{}}`
    // prop (used for a handful of dynamic values — chart colors, the
    // commission-slider gradient) compiles to inline style attributes,
    // which a nonce can't cover cleanly without threading it through every
    // component. Inline *styles* (not scripts) are the accepted, common
    // trade-off here — script-src is where injection actually matters, and
    // that stays clean. Documented rather than silently claimed compliant
    // against the literal §12.6 #12 wording.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-src challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
}

function clearSessionCookies(res: NextResponse): void {
  for (const name of SESSION_COOKIE_NAMES) res.cookies.delete(name);
}

type AuthedRequest = NextRequest & {
  auth: { user?: { id?: string; role?: string; sessionVersion?: number; sid?: string } } | null;
};

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = (req as AuthedRequest).auth;

  // --- Instant revocation (PRD §12.1): a Redis-cached sessionVersion or a
  // single killed session both invalidate this JWT immediately, without
  // waiting for its 24h rolling refresh. A cache miss trusts the token
  // rather than mass-logging-out every session on a cold cache.
  if (session?.user?.id) {
    const [cachedVersion, revoked] = await Promise.all([
      getCachedSessionVersion(session.user.id),
      session.user.sid ? isSessionRevoked(session.user.sid) : Promise.resolve(false),
    ]);
    const versionStale =
      cachedVersion !== null && session.user.sessionVersion !== undefined && cachedVersion !== session.user.sessionVersion;

    if (versionStale || revoked) {
      const loginUrl = new URL(pathname.startsWith("/admin") ? "/admin/login" : "/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const res = NextResponse.redirect(loginUrl);
      clearSessionCookies(res);
      return res;
    }
  }

  // --- RBAC route-prefix gate (PRD §3.1 / §12.2 layer 1 of 3) ---
  // /admin/login is the admin-only sign-in page (rewritten to
  // app/admin-login/ — see next.config.ts) — it must stay reachable by a
  // signed-out visitor despite matching the "/admin" prefix below.
  const matchedPrefix =
    pathname !== "/admin/login" ? Object.keys(ROLE_PREFIXES).find((p) => pathname.startsWith(p)) : undefined;
  if (matchedPrefix) {
    const requiredRole = ROLE_PREFIXES[matchedPrefix];

    if (!session?.user) {
      const loginUrl = new URL(requiredRole === "admin" ? "/admin/login" : "/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.user.role !== requiredRole) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // --- Security headers + nonce-based CSP (PRD §12.3) ---
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)",
  ],
};
