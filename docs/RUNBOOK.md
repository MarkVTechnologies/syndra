# Syndran Operational Runbook

Operational procedures for running Syndran in production. This is not a design
doc — it assumes you've read `README.md` for architecture and points at PRD
sections for the "why." Written for whoever is on call, including a future
version of the person who built this.

## 1. Topology (ADR-001 — no Docker/Kubernetes)

Every piece is managed/serverless. There is no server to SSH into and no
container to restart.

| Component        | Provider                          | What breaks if it's down |
|-------------------|-----------------------------------|---------------------------|
| App (frontend + all backend logic) | Vercel (Next.js)      | Everything |
| Primary database  | MongoDB Atlas (replica set — required for transactions) | Everything reading/writing data |
| Cache/rate-limit/session revocation | Upstash Redis   | Login throttling fails open to "not limited"; instant session revocation stops working (stale JWTs still validate until they expire) |
| Background jobs   | Inngest Cloud                     | Emails, reservation TTL release, commission maturation, digest — all queue up and replay once it recovers |
| Transactional email | Resend                          | No emails sent; core app flows unaffected |
| Media uploads     | Cloudinary                        | New opportunity image uploads fail; existing images unaffected |
| Payments          | Paystack                          | New investments can't be paid for; existing data unaffected |
| Bot/spam gate     | Cloudflare Turnstile              | Waitlist + signup forms reject all submissions (fail closed by design) |

**First move for any incident**: check `GET /api/health` — it pings Mongo
and Redis and returns `{status, checks, sha}`. A 503 with `checks.mongo:
false` or `checks.redis: false` tells you which dependency to check first
before looking at application code.

## 2. Environment variables

Full schema: `backend/core/src/env.ts` (`getEnv()` throws at boot listing
every invalid/missing var by name — read that error, don't guess). Required
vs optional is enforced there; this is just the operational grouping.

- **Secrets that must be rotated if ever exposed**: `AUTH_SECRET`,
  `ENCRYPTION_KEY`, `ATTRIBUTION_SECRET`, `MONGODB_URI`,
  `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `PAYSTACK_SECRET_KEY`,
  `CLOUDINARY_API_SECRET`, `TURNSTILE_SECRET_KEY`.
- Rotating `AUTH_SECRET` invalidates every existing session (all JWTs stop
  verifying) — this is the nuclear "log everyone out" option, not a
  routine action.
- `ENCRYPTION_KEY` is a 32-byte hex string (64 chars). Rotating it without a
  migration breaks decryption of anything already encrypted at rest — check
  what actually depends on it before touching it.
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` are only read once, by
  `pnpm db:seed` (`backend/db/src/scripts/seed-admin.ts`), to create the
  first admin. **Rotate the password immediately after first login** — the
  seed script has no mechanism to force this, so it's a manual step (PRD
  §13.3, §15.1).

## 3. Go-live (PRD §13.4)

The waitlist → live-platform conversion is one deliberate, irreversible
admin action, not a deploy step.

1. Confirm `pnpm db:seed` has run against production and the admin password
   has been rotated (step 2).
2. Confirm Resend, Turnstile (production keys, not test keys), Paystack,
   and Cloudinary are all configured with **production** credentials — the
   CI env block and any preview deployment use placeholder/test values.
3. Log in as admin → `/admin/waitlist` → **Launch Syndran** panel. It shows the
   exact count of waitlist registrants who will be emailed.
4. Type `LAUNCH SYNDRAN` exactly to enable the confirm button, then confirm.
   This, in order:
   - flips `settings.appLaunched` to `true` (`setAppLaunched()`, `@san/db`),
   - issues each pending registrant a 14-day single-use login token
     (`launchTokenHash` on their waitlist row),
   - emits `waitlist/launch_invite` → Resend sends each their `/launch/{token}`
     link (`backend/services/waitlist/src/index.ts: launchAndBroadcast`).
5. **This step is safe to re-run.** Already-converted rows are skipped;
   only still-pending registrants get (re-)invited. There is no "undo" for
   emails already sent, but running it twice does not double-invite anyone
   or corrupt data.
6. A registrant clicking their link hits `GET /launch/[token]`
   (`frontend/app/launch/[token]/route.ts`), which converts their waitlist
   row into a real `User` + `Ambassador` profile
   (`convertViaLaunchToken()`) and redirects to `/login` with their email
   pre-filled — they log in with the password they set at waitlist
   registration, never a magic-link auto-login.

## 4. Incident response

### Compromised or suspicious session
Session revocation is instant (checked on every request by
`frontend/middleware.ts` against Upstash — no waiting for JWT expiry):
- **Kill one session**: the user (or anyone with the emailed link) hits the
  "This wasn't me" URL from the login-alert email → `GET
  /api/sessions/kill?token=...` → `killSessionByToken()` resolves the
  single-use kill token and calls `markSessionRevoked()`, setting
  `revoked:{sessionId}` in Redis.
- **Kill every session for a user** (e.g. suspected account takeover):
  bump that user's `sessionVersion` in Mongo and call
  `cacheSessionVersion()` — every JWT carrying the old version fails
  middleware's check on its next request, everywhere, immediately.
- **Force logout everyone platform-wide**: rotate `AUTH_SECRET` (see §2).
  Last resort — this also breaks any in-flight "remember me" flows.

### Account locked out by brute-force protection
`backend/services/identity/src/login-throttle.ts`: 5 failed attempts for
one email locks that email for 30 minutes (`login:lock:{email}` in Redis);
20 failed attempts from one IP across any accounts rate-limits that IP.
To manually clear a lockout (e.g. a legitimate user who forgot their
password and got locked before requesting a reset): delete the
`login:lock:{email}` and `login:fail:email:{email}` keys in the Upstash
console, or point them to "Forgot password?" instead — a successful
reset clears the throttle counters itself (`clearFailedAttempts()`).

### Suspected bad commission entry
Never delete or edit a commission row — the ledger is append-only by
design (PRD §6.3 LEDGER INVARIANT). Use the reversal flow, which creates a
new signed-negative entry carrying the original's current state
(`backend/services/commission/src/ledger.ts`). This nets into the correct
balance bucket without ever mutating history, so an audit always shows what
actually happened, including the mistake and its correction.

### Ledger reconciliation drift alert
A daily 00:00 UTC cron (`backend/services/commission/src/cron.ts:
reconciliationCron`) compares every ambassador's ledger balance
(`balanceFor()`, aggregated fresh from `commissions` each run) against
their cached `ambassador.stats` counter and emails every active admin a
per-ambassador breakdown on any mismatch. **This never auto-corrects
anything** — a drift almost always means some write path updated the
ledger without updating the cached counter (or vice versa). To resolve:
find the write path that skipped the counter update, fix it going forward,
then reset `ambassador.stats` for the affected rows to match the ledger
(the ledger is always the source of truth — never the other way around).

### Webhook replay / suspected double-processing
Paystack webhooks are deduped two ways before they can double-accrue a
commission: a Redis event-id claim (fast path) and a MongoDB partial-unique
index on `{investmentId: 1}` filtered to `entryType: "accrual"` (DB-level
backstop if Redis is unavailable or the same event somehow arrives twice).
If you need to manually replay a webhook for debugging, expect the second
attempt to be silently absorbed as a no-op, not an error — that's the
dedupe working correctly, not a bug.

## 5. Monitoring (requires live infra — not configured in this repo)

These are flagged rather than faked, since none of them can be verified
without a deployed environment:

- **Uptime monitor**: point any external monitor (UptimeRobot, Better
  Stack, etc.) at `GET /api/health` on the production URL. Alert on
  non-200 or `status: "degraded"`.
- **Sentry alert routing**: `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` are in the
  env schema as optional — wire an actual Sentry project and confirm
  alerts route somewhere a human will see them before relying on this.
- **PITR (point-in-time recovery) restore drill**: MongoDB Atlas has to be
  on a tier with continuous backups enabled for this. Actually perform a
  restore into a scratch cluster at least once before go-live so "we have
  backups" isn't an untested assumption.
- **securityheaders.com / Lighthouse**: the CSP, HSTS, and other security
  headers are implemented in `frontend/middleware.ts` — run these against
  the live production URL after deploy to confirm they're actually being
  served (a misconfigured CDN/proxy can silently strip headers that work
  correctly in `next dev`).

## 6. E2E tests (`e2e/`)

Playwright suite covering the golden paths (waitlist registration, login +
RBAC, the launch confirmation gate, automated accessibility checks). It
deliberately never spins up its own database — there's no local-Mongo path
in this architecture (§1) — so it always runs against a real, already-live
Syndran instance.

- **Local**: `pnpm test:e2e:install` once (installs Chromium + WebKit),
  then `pnpm test:e2e` against a local `next dev` (needs a real `.env` with
  working Atlas/Upstash/Turnstile — the same requirement `next dev` itself
  has).
- **CI**: the `e2e` job in `.github/workflows/ci.yml` only runs when the
  `E2E_BASE_URL` repository variable is set, pointing at a deployed preview
  with real (or test-mode) infra behind it. `E2E_ADMIN_EMAIL` /
  `E2E_ADMIN_PASSWORD` secrets must match whatever admin was seeded there.
- **Turnstile**: the target environment's `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  must be Cloudflare's documented always-pass test key
  (`1x00000000000000000000AA`) for the waitlist-registration test to get
  past the challenge headlessly. Never use that key in real production.
- The launch-panel test (`admin-launch.spec.ts`) only checks the
  confirmation gate's UI logic and explicitly never clicks the final
  confirm button — `launchAndBroadcast()` is a one-way door (see §3) and
  this suite must be safe to run repeatedly against a shared preview.
