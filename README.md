# Syndran — Syndicators Ambassadors Network

A real-estate syndication distribution platform: admin-published investment
opportunities, a network of ambassador-realtors with personal marketing
microsites, and attributed syndicator investors with automated commission
accrual. Build spec: `SAN-Engineering-PRD-v1.0.docx` (referenced throughout
this codebase as "PRD §X").

## Architecture

Monorepo, two top-level halves, per an explicit project requirement to keep
frontend and backend in separate folders:

```
san/
├─ frontend/           Next.js 15 App Router — UI, pages, route handlers, auth
├─ backend/
│  ├─ core/             @san/core        — Zod schemas, money, Result type, env
│  ├─ db/               @san/db          — Mongo client, Mongoose models, indexes
│  ├─ email/            @san/email       — React Email templates + renderer
│  └─ services/          eight+ bounded domain packages, each exposing only
│                         a public index.ts (PRD §4.3):
│     ├─ identity/       @san/service-identity
│     ├─ waitlist/       @san/service-waitlist    (Phase 0 — not in the PRD's
│     │                                             8-domain catalog; added
│     │                                             since Phase 0 needs an
│     │                                             owner too)
│     ├─ ambassador/     @san/service-ambassador   (full — profile, slug
│     │                                             claim/change, promote,
│     │                                             microsite data)
│     ├─ syndicator/     @san/service-syndicator   (full — onboarding +
│     │                                             R1-R7 attribution)
│     ├─ catalog/        @san/service-catalog      (full — CRUD, publish,
│     │                                             allocation via investment)
│     ├─ investment/     @san/service-investment   (full — commit, Paystack
│     │                                             adapter, transactional
│     │                                             confirm, TTL release)
│     ├─ commission/     @san/service-commission   (full — accrue, mature,
│     │                                             payout, reverse, balance)
│     ├─ notification/   @san/service-notification
│     └─ analytics/      @san/service-analytics
├─ e2e/                 @san/e2e         — Playwright E2E + accessibility suite
│                                          (runs against a live deployment only —
│                                          see docs/RUNBOOK.md §6)
├─ docs/                RUNBOOK.md — deployment, incident response, go-live
├─ eslint.config.mjs    boundary enforcement (see below)
└─ turbo.json, pnpm-workspace.yaml
```

**Why services, not container microservices** — ADR-001, PRD §4.1: the
5-day window and the commission ledger's need for ACID transactions rule out
container-per-service. Instead, every domain lives behind a typed
`index.ts`; ESLint blocks any import of another service's internals
(`no-restricted-imports` in `eslint.config.mjs`), and `frontend/` is blocked
from importing `@san/db` directly — it must go through a service. This is
the one rule that keeps the "microservice-ready" claim honest; CI fails on
violation.

## What's built (Day 1 — Foundation + Phase 0 Waitlist)

Per PRD §14 Day 1, this is the go-to-market gate: Phase 0 must work
end-to-end before the rest of the app exists.

- **Monorepo**: Turborepo, pnpm workspaces, TypeScript strict
  (`noUncheckedIndexedAccess`), ESLint boundary rules, GitHub Actions CI.
- **Design system** ("SAN Obsidian", PRD §10): CSS custom property tokens,
  Tailwind v4 `@theme`, primitives (Button, Input, Select, Checkbox, Card,
  Badge, Skeleton, Accordion, DropdownMenu, FormField), motion provider with
  global `prefers-reduced-motion` handling, count-up metrics.
- **Data layer**: Mongo client with connection reuse, every collection from
  PRD §6.2 modeled (`users` through `settings`), explicit `syncIndexes`
  script (`pnpm db:indexes`) — `autoIndex` is off, indexes are never built
  on a hot path.
- **Landing page**: hero with live animated counter, how-it-works, benefits
  grid, opportunity preview, an interactive commission slider, FAQ, footer —
  all mobile-first, staggered scroll reveals.
- **Waitlist flow**: Zod validation shared client/server, Turnstile +
  honeypot + 5/min/IP rate limit, slug availability check (debounced, live),
  Argon2id password hashing, no-enumeration duplicate handling, a designed
  success panel with position + reserved slug + share link.
- **Email pipeline**: Inngest event (`waitlist/registered`) → React Email
  template on the SAN tokens → Resend → `email_log`, with Redis-backed
  idempotency (PRD §9.1).
- **Admin console**: seeded-account login, `/admin/waitlist` — KPI strip,
  growth chart, searchable/paginated table (desktop table + mobile stacked
  cards), row actions (resend, flag spam), streaming CSV export, all
  actions written to the append-only `audit_logs`.
- **PWA**: manifest, Serwist service worker (NetworkFirst for HTML/API,
  StaleWhileRevalidate for static assets, CacheFirst for Cloudinary images),
  offline fallback page, push-ready handlers. Placeholder icon set
  generated by `scripts/generate-placeholder-icons.mjs` — **swap for real
  brand assets before Day 5 launch** (PRD §16.4).
- **Security**: nonce-based CSP + HSTS + standard headers in middleware,
  RBAC route-prefix gate (`/admin`, `/dashboard`, `/portfolio`), per-route
  rate limiting (Upstash sliding window), `/api/health` for uptime
  monitoring.
- **Commission math**: `calcCommission()` in `@san/service-commission` is
  implemented and unit-tested against the PRD §8.2 worked example, rounding
  boundaries, zero-commission, and negative-bps cases — ahead of the ledger
  wiring itself, so the one function every payout depends on is correct
  first.

## What's built (Day 2 — Identity, Catalog, Admin Control Plane)

- **Full identity**: registration (`/signup`), email verification
  (magic-link token, hashed at rest, 30-min expiry), forgot/reset password,
  admin approve/suspend. Every login sends the **mandatory** login-alert
  email (device, IP, approximate location via `@vercel/functions`
  `geolocation()`, one-click "this wasn't me" kill-session link) and
  creates a real `Session` document — JWT-strategy NextAuth otherwise has
  no per-device record, which would make that link impossible.
- **Instant session revocation, properly architected** (PRD §12.1): NextAuth
  config is split into `auth.config.ts` (edge-safe, no DB) and `auth.ts`
  (full, DB-backed) — the standard v5 pattern for a database provider. A
  Redis-only subpath (`@san/service-identity/session-cache`) lets
  `middleware.ts` check a cached `sessionVersion` and a per-session kill
  flag on *every request*, at REST-call cost, with zero Mongo/native deps
  in the edge bundle. A cache miss trusts the token rather than
  mass-logging-out on a cold cache.
- **Opportunity catalog**: full CRUD, publish-checklist validation (image,
  commission, pricing, summary — unit-tested), admin builder as a 4-step
  wizard (Basics → Media → Pricing → Review) with a live card preview,
  Cloudinary signed direct upload with native drag-reorder.
- **Admin control plane**: opportunity list/detail, ambassador directory
  (approve/suspend/reactivate, detail sheet), append-only audit log viewer,
  a ⌘K command palette. Overlay tier added: Dialog, BottomSheet, Tooltip.
- **Ambassador onboarding wizard**: photo → headline/bio → WhatsApp confirm
  → promote first opportunity(ies), state preserved across steps, ends on
  the same share-link success panel pattern as the Day 1 waitlist.

## What's built (Day 3 — Microsite, Promotion, Attribution)

This is the trickiest correctness surface in the PRD — attribution must be
*provably* right, so it's unit-tested before anything else touches it
(23 tests: 14 for R1-R7 attribution precedence/forgery/expiry, plus the
carried-forward commission and identity suites).

- **Attribution (PRD §8.1 R1-R7)**: signed HMAC token (slug + issuedAt, 24h
  validity, timing-safe verify) embedded on the onboarding form; resolution
  precedence signed token → `san_ref` cookie → `?ref=` → house; self-referral
  guard (email/phone match); and `referredBy` immutability enforced *at the
  DB layer* — a Mongoose pre-hook rejects any update-path write to that
  field, not just "no code path calls it". A forged-slug or tampered-token
  attempt is rejected before it ever reaches Mongo.
- **Public microsite** (`/[slug]`, ISR 60s + tag-based revalidation on
  promote/unpromote): ambassador hero, promoted-opportunity grid, opportunity
  detail page, JSON-LD, dynamic OG image, sticky WhatsApp CTA, 90-day
  cookie refreshed on every visit, session-deduped view tracking.
- **WhatsApp integration**: pre-filled contextual `wa.me` links per
  opportunity, click tracking, call fallback, native share sheet.
- **Syndicator onboarding** (`/[slug]/join`): reuses `identity.register()`
  rather than duplicating it, then attributes + fires the three PRD-mandated
  emails (verify, welcome-with-ambassador-card, ambassador new-referral
  alert) — landing on a minimal `/portfolio` (full syndicator app is Day 4).
- **Ambassador dashboard**: opportunity marketplace with an optimistic
  spring-animated promote toggle, microsite editor (headline/bio/WhatsApp),
  slug change (1/30-day rate limit, 90-day 301 redirect map), copy/QR/share
  link card, referral list, views→clicks→referrals funnel chart.

## What's built (Day 4 — Investment Flow, Commission Ledger, Notifications)

The money-movement day. Every write that touches the ledger runs inside a
real MongoDB transaction (requires a replica set — Atlas M10, per PRD §1.2
#4; a standalone mongod does not support transactions).

- **Investment flow**: atomic allocation reservation (`pricing.reservedUnits`,
  a single conditional `findOneAndUpdate` — no transaction needed for that
  step alone), a 30-minute soft reservation with an Inngest cron releasing
  expired ones every 5 minutes, a Paystack adapter (initialize + HMAC-SHA512
  webhook verification, adapter pattern so Flutterwave is one file), and a
  bank-transfer fallback path.
- **The transaction** (confirm()): investment status → confirmed, allocation
  moves reserved → sold, commission accrues, and — if this sells out the
  opportunity — status → sold_out, all in one `session.withTransaction()`.
  A failure anywhere rolls back all of it.
- **Idempotency, two layers deep**: a Redis claim on the Paystack event id
  (fast, first line of defense) plus a partial-unique Mongo index on
  `commissions{investmentId, entryType:"accrual"}` (DB-level, catches a
  race between two concurrent webhook deliveries the Redis check alone
  wouldn't). A webhook replayed ten times produces one ledger entry.
- **The ledger**: `accrue`/`markPayable`(hourly cron)/`markPaid`/`reverse`/
  `balanceFor`/`statementFor`/`requestPayout`/`reconcile`. Reversals are
  new signed-negative entries that carry the *original's current state*,
  so they net against the right balance bucket without ever mutating the
  original record (PRD §6.3 LEDGER INVARIANT) — verified by dedicated
  tests, not just asserted in a comment.
- **Notifications**: all 14 templates from the PRD §9.2 catalogue are now
  live (7 added this day: You're Live, Complete Your Investment, Investment
  Confirmed, Commission Earned, admin investment alert, Payout Sent, Daily
  Digest), plus the digest cron.
- **Syndicator app**: marketplace, opportunity detail, a 3-step commit flow
  (units → summary → payment), portfolio view with real investment history.
- **Ambassador earnings**: real ledger balance (payable/pending/paid), a
  statement table, and a payout request flow. A minimal admin payouts page
  (typed-amount-confirmation to mark paid) — full batch management UI is
  Day 5 scope, but the underlying `markPaid()` needed a way to exercise it.
- **Tests**: since transactional integration tests need a real replica set
  this sandbox doesn't have, the DB-touching functions were restructured so
  their *decisions* (double-webhook idempotency, which balance bucket a
  reversal debits, sold-out detection, the R7 house-account short-circuit)
  are pure and exhaustively unit-tested (25 new tests) independent of Mongo.
  Full transactional coverage needs wiring against Atlas — noted, not
  hidden.

## What's built (Day 5 — Security Hardening, Admin Analytics, Launch)

- **Dependency security**: `pnpm audit --prod` found 47 vulnerabilities (5
  critical) — a critical RCE and a critical middleware Authorization
  Bypass in `next@15.1.3`, plus two critical Auth.js vulnerabilities in
  `next-auth@5.0.0-beta.25`. Bumped `next`→15.5.24, `next-auth`→5.0.0-beta.32;
  re-audit came back at 6 vulnerabilities (0 critical, 2 high), all
  transitive and pinned inside build-tool dependency trees — documented as
  accepted, not silently ignored.
- **Login brute-force protection** (PRD §12 non-negotiable, previously
  missing despite being explicit spec): `backend/services/identity/src/login-throttle.ts`
  — 5 failed attempts locks an email for 30 minutes, 20 failed attempts
  from one IP rate-limits that IP, both Redis-backed with a real TTL, plus
  an `AccountLocked` email. Wired into `auth.ts` via `authenticateWithThrottle()`.
- **Injection hardening**: found raw user search strings feeding MongoDB
  `$regex` in 5 places (ReDoS/injection risk) — added `escapeRegex()`
  (`@san/core/sanitize`) and applied it everywhere a search term reaches
  `$regex`.
- **Admin analytics**: `adminOverview()` — platform KPIs, ambassador
  leaderboard, investment pipeline — backing a real `/admin` dashboard
  (previously a bare redirect).
- **Payout batch management**: status filter tabs (all/requested/paid) and
  a CSV export on `/admin/payouts`, extending the existing per-payout
  typed-amount-confirmation flow rather than replacing it — mass one-click
  mark-paid was deliberately not built, since it would remove the audit
  trail's main safety control for money leaving the platform.
- **Launch flow** (PRD §13.4): `/admin/waitlist` gets a **Launch Syndran**
  panel requiring the admin to type an exact confirmation phrase before
  the (irreversible, one-way) broadcast fires. `launchAndBroadcast()`
  flips `settings.appLaunched` and emails every pending waitlist row a
  personalised, single-use `/launch/{token}` link; `convertViaLaunchToken()`
  turns that into a real `User` + `Ambassador` profile on first click, then
  routes to `/login` — never auto-authenticates from a bare GET link.
- **Loading states**: ~14 route-level `loading.tsx` skeletons across
  admin/dashboard/portfolio so navigation never shows a blank flash while
  Server Components fetch.
- **E2E test suite** (`e2e/`, Playwright): golden-path coverage for
  waitlist registration, login + RBAC route protection, the launch
  confirmation gate, and an automated accessibility scan (axe) on every
  public page. Runs only against a real deployed instance — this
  architecture (ADR-001) has no local-Mongo/Docker path to spin up a
  throwaway backend for it — so it's wired into CI as a conditional job
  that activates once an `E2E_BASE_URL` preview target exists, rather than
  faked against a mock.
- **Nightly reconciliation alerting**: `reconcile()` (ledger vs. cached
  `ambassador.stats`) existed as a bare function with no caller — the
  actual PRD §8.4 requirement is the schedule and the alert, not just the
  check. Added `reconcileAll()`, a daily 00:00 UTC Inngest cron
  (`commission/cron.ts: reconciliationCron`) that runs it across every
  ambassador and, on any drift, emails every active admin a
  `ReconciliationAlert` listing each mismatch (ledger vs. cached, per
  ambassador). It only flags drift — it never auto-corrects a balance,
  since silently rewriting a balance is exactly the kind of thing that
  must be a deliberate, audited action.
- **Operational runbook** (`docs/RUNBOOK.md`): topology + blast radius per
  dependency, environment variable rotation rules, the go-live procedure,
  incident response (session kill, lockout clearing, commission reversal,
  webhook replay), and monitoring items that need live infra to verify
  (uptime monitor, Sentry routing, a PITR restore drill,
  securityheaders.com/Lighthouse) — flagged as unverified rather than
  claimed.

## Real browser walkthrough — two bugs curl testing couldn't catch

Every prior verification pass in this build used curl and API-level checks,
which confirmed the backend worked but never actually loaded a page in a
browser and let its client-side JS run. Doing that surfaced two real,
previously-invisible bugs:

1. **The production CSP broke local dev entirely.** `frontend/middleware.ts`
   sets a strict `script-src` with no `unsafe-eval` (correct for
   production, PRD §12.6 check #12). Next.js's dev-mode Fast Refresh
   runtime evaluates code via `eval()` — without an exception, that throws
   inside `main-app.js` on every single page load, so the client bundle
   never finishes executing and **nothing hydrates**. Every "use client"
   component (every Framer Motion animation, every form) sat frozen at its
   server-rendered initial state (`opacity: 0`) with no error visible
   anywhere except a console exception. Fixed by conditionally adding
   `'unsafe-eval'` only when `NODE_ENV === "development"` — production's
   policy is unchanged.
2. **Four Server Component pages crashed on render**: `/admin`,
   `/admin/waitlist`, `/dashboard`, `/dashboard/earnings` all passed an
   inline arrow function as a `format` prop into `StatCard` → `CountUp`
   (a `"use client"` component) — `<StatCard format={(n) => fmt(n)} />`.
   Functions can't cross the Server→Client Component serialization
   boundary; React caught it and rendered "Something went wrong" instead
   (a `200` response with an error UI, which is exactly why curl-only
   testing missed it since Day 2, when this pattern was first introduced).
   Fixed by changing `format` to a fixed keyword (`"percent" | "money"`)
   that `CountUp` resolves to a formatter internally, rather than a
   callback — the fix generalizes to every call site, including the
   marketing page's commission slider (already a Client Component, so
   unaffected, but simplified to the same shared pattern).

Both are demonstrated and confirmed fixed: `/`'s hero now animates in
correctly, and `/admin`'s KPI cards render with correct `₦0`/`0%`
formatting instead of an error boundary.

### A note on this sandbox's disk

Verifying the above required repeatedly restarting `next dev`, and each
restart surfaced how close to full this host's disk is — `df -h /` swings
between roughly 150MB and 2.7GB free after every cleanup and gets consumed
again within minutes of running the dev server, regardless of how
aggressively `frontend/.next` is cleared. 476GB of the 477GB filesystem is
used by something outside this project entirely, since clearing every
build artifact this repo owns barely moves the needle. When disk hits
bottom, symptoms cascade: `next dev`'s Jest worker pool crashes
("`Jest worker encountered 2 child process exceptions`"), routes start
502/500ing, and in one case the browser tab itself became unresponsive to
automation. None of this is an application bug — it's host disk exhaustion
outside this project's control, and needs the user to free real disk space
on the machine, not just this repo's caches.

## What's stubbed / needs live infra

Everything from Day 1-5's PRD scope is implemented in code. What remains
needs a deployed environment this sandbox doesn't have, and is called out
rather than faked:

- **Transactional integration tests** against a real MongoDB replica set
  (Atlas M10+) — decision logic is exhaustively unit-tested independent of
  Mongo instead (see Day 4).
- **Playwright E2E runs** — the suite is written and CI-wired but has
  never executed against a live instance (no Atlas/Upstash/Turnstile
  credentials in this sandbox).
- **Live security/perf verification**: securityheaders.com, Lighthouse,
  and a PITR restore drill all require a deployed production URL and a
  real Atlas cluster — see `docs/RUNBOOK.md` §5.
- **Physical device / cross-browser pass** and a manual screen-reader
  pass — the automated axe scan in the E2E suite catches mechanical a11y
  violations but is not a substitute for either.

## MongoDB Atlas — connected and three real bugs it surfaced

A real Atlas M0 cluster is now wired up (`.env`'s `MONGODB_URI`), indexes
synced (`pnpm db:indexes`), and the admin account seeded (`pnpm db:seed`).
Getting an actual login working end-to-end against it — not just a health
ping — surfaced three real bugs that a placeholder-URI sandbox could never
have caught:

1. **Mongoose's `models` named export doesn't survive plain ESM** (`tsx`
   running `.ts` scripts directly, no bundler in between) — `import {
   models } from "mongoose"` threw `SyntaxError: ... does not provide an
   export named 'models'` in all 15 model files. Worked fine under
   webpack/Next's bundler (which is why the app's own build never caught
   it) but broke `pnpm db:indexes` / `pnpm db:seed` outright. Fixed by
   importing the default export and destructuring: `import mongoose, {
   Schema, model, ... } from "mongoose"; const { models } = mongoose;`.
2. **`connectDb()` cached a promise, not a connection** (`backend/db/src/client.ts`).
   Two failure modes: (a) if the very first `mongoose.connect()` call
   rejected — e.g. the app's first request racing an Atlas IP allow-list
   update — the rejected promise stayed cached forever, permanently
   wedging that process; (b) even a *successfully* resolved connection can
   later drop (idle timeout, Atlas failover) while the resolved promise
   object sticks around, so every subsequent call kept reusing it and
   every query buffered against a dead socket until timeout. Fixed by
   clearing the cache on rejection and checking `mongoose.connection.readyState`
   (must be 1 connected or 2 connecting) before reusing the cached promise.
3. **Every `inngest.send()` call in the codebase failed closed** (19 call
   sites across identity, waitlist, investment, syndicator, and two crons)
   — a misconfigured or unreachable Inngest would throw uncaught and take
   down whatever request triggered it, even though the actual DB write
   (the registration, the investment, the login) had already succeeded.
   Fixed with one shared wrapper, `sendEvent()` in
   `@san/service-notification` (`clients.ts`), that catches, logs, and
   returns whether the send succeeded — every call site across the
   codebase now goes through it instead of the raw client. The two cron
   loops (`admin-digest`, `commission-reconciliation`) track the wrapper's
   per-item return value so one bad recipient can't stop the rest of the
   list from being notified. See `docs/RUNBOOK.md` §1 for why failing open
   here is the correct direction.

## Fonts

PRD §10.3 specifies Satoshi Variable (Fontshare) for Display type. Fontshare
isn't on Google Fonts and needs a manual license/download, so
`frontend/app/fonts.ts` currently falls back Display to Inter 700/900 —
visually close, zero build risk. Download Satoshi from Fontshare, drop the
variable font file under `frontend/public/fonts/satoshi/`, and swap the
`displayFont` export to `next/font/local` when ready.

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in real values — see PRD §15.1
pnpm db:indexes              # sync Mongo indexes
pnpm db:seed                 # seed the admin account from ADMIN_SEED_*
pnpm dev                     # http://localhost:3000
```

Required accounts before `pnpm dev` will fully work: MongoDB Atlas, Upstash
Redis, Resend (+ verified sending domain), Cloudflare Turnstile. Inngest,
Cloudinary, Paystack, Sentry and PostHog can be added incrementally — see
`.env.example`, all validated at boot by `backend/core/src/env.ts`.

To run the Inngest dev server locally (so `waitlist/registered` actually
sends an email):

```bash
npx inngest-cli@latest dev
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the Next.js app |
| `pnpm build` | Build all workspace packages |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Run across the whole monorepo via Turbo |
| `pnpm db:indexes` | Explicit index sync (production-safe — `autoIndex` is off) |
| `pnpm db:seed` | Seed the admin account + settings singleton |
| `pnpm test:e2e:install` | One-time Playwright browser install |
| `pnpm test:e2e` | Run the E2E suite against `E2E_BASE_URL` (defaults to `localhost:3000`) — see `docs/RUNBOOK.md` §6 |

## Deploying

Targets Vercel per PRD §1.2 (no Docker, no Kubernetes). `frontend/vercel.ts`
sets the monorepo build/install commands (see the Vercel platform's
`vercel.ts` convention). Set the Vercel project root directory to
`frontend/`, and set all `.env.example` variables in the Vercel dashboard
per environment (Production / Preview) per PRD §15.2.
