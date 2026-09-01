import { Resend } from "resend";
import { Redis } from "@upstash/redis";
import { Inngest, EventSchemas } from "inngest";
import { getEnv } from "@san/core/env";
import { getResendConfig } from "@san/db";

/**
 * Constructed fresh on every call rather than cached as a singleton: the
 * API key can now come from the admin settings UI (DB-first, .env
 * fallback — see @san/db/integrations), and a cached client would keep
 * using a just-replaced key until process restart. The Resend SDK's
 * constructor does no I/O, so this costs nothing measurable; the actual
 * resolved *config* is what's cached (60s TTL) inside getResendConfig().
 */
export async function getResend(): Promise<Resend> {
  const { apiKey } = await getResendConfig();
  return new Resend(apiKey);
}

let _redis: Redis | null = null;
export function getRedis(): Redis {
  if (!_redis) {
    const env = getEnv();
    _redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// Domain events the notification package subscribes to. Each service emits;
// this package never imports another service's internals to send email —
// it only reacts to events. PRD §9.1.
type Events = {
  "waitlist/registered": {
    data: {
      waitlistId: string;
      email: string;
      fullName: string;
      desiredSlug: string;
      position: number;
    };
  };
  "user/registered": {
    data: { userId: string; email: string; verifyUrl: string };
  };
  "user/verified": {
    data: { userId: string; email: string; role: "admin" | "ambassador" | "syndicator"; dashboardUrl: string };
  };
  "user/login": {
    data: {
      userId: string;
      email: string;
      deviceLabel: string;
      ip: string;
      geo: string;
      timestamp: string;
      killSessionUrl: string;
    };
  };
  "user/password_reset_requested": {
    data: { email: string; resetUrl: string; requestingIp: string };
  };
  "user/password_changed": {
    data: { email: string; revokeAllUrl: string; changedAt: string };
  };
  "syndicator/onboarded": {
    data: {
      syndicatorId: string;
      email: string;
      dashboardUrl: string;
      ambassador: { fullName: string; whatsapp: string; avatarUrl: string | null } | null;
    };
  };
  "syndicator/referred": {
    data: {
      ambassadorEmail: string;
      syndicatorFirstName: string;
      referralCount: number;
      dashboardUrl: string;
    };
  };
  "ambassador/approved": {
    data: { ambassadorEmail: string; fullName: string; slug: string; micrositeUrl: string };
  };
  "investment/created": {
    data: {
      investmentId: string;
      syndicatorEmail: string;
      opportunityTitle: string;
      units: number;
      amountMinor: number;
      reservedUntil: string;
      summaryUrl: string;
    };
  };
  "investment/confirmed": {
    data: {
      investmentId: string;
      syndicatorEmail: string;
      units: number;
      amountMinor: number;
      opportunityTitle: string;
      roiPercent: number | null;
      documentUrls: string[];
      statementUrl: string;
    };
  };
  "commission/accrued": {
    data: {
      ambassadorEmail: string;
      opportunityTitle: string;
      syndicatorFirstName: string;
      amountMinor: number;
      maturesInDays: number;
      dashboardUrl: string;
    };
  };
  "admin/investment_alert": {
    data: {
      adminEmail: string;
      opportunityTitle: string;
      amountMinor: number;
      units: number;
      adminUrl: string;
    };
  };
  "payout/paid": {
    data: {
      ambassadorEmail: string;
      amountMinor: number;
      method: string;
      reference: string;
      commissionCount: number;
      dashboardUrl: string;
    };
  };
  "user/login_locked": {
    data: { email: string; ip: string; unlocksInMinutes: number };
  };
  "waitlist/launch_invite": {
    data: { waitlistId: string; email: string; fullName: string; reservedSlug: string; loginUrl: string };
  };
  "commission/reconciliation_drift": {
    data: {
      adminEmail: string;
      date: string;
      drifts: {
        ambassadorName: string;
        ledgerPendingMinor: number;
        ledgerPaidMinor: number;
        cachedPendingMinor: number;
        cachedPaidMinor: number;
      }[];
      adminUrl: string;
    };
  };
  "admin/digest": {
    data: {
      adminEmail: string;
      date: string;
      signups24h: number;
      referrals24h: number;
      investmentVolumeMinor: number;
      commissionsAccruedMinor: number;
      adminUrl: string;
    };
  };
};

export const inngest = new Inngest({
  id: "san",
  schemas: new EventSchemas().fromRecord<Events>(),
});

/**
 * Fail-open wrapper around inngest.send(). Every caller across the
 * codebase sends an event as the LAST step after a DB write that already
 * succeeded (a registration, an investment, a login) — a misconfigured or
 * unreachable Inngest must never turn that already-successful action into
 * a user-facing error. Losing a notification is a strictly smaller failure
 * than losing the action itself, so this logs and swallows rather than
 * throwing. Returns whether the send actually succeeded, for the rare
 * caller (a cron looping over many recipients) that wants to track how
 * many went out.
 */
export async function sendEvent(event: Parameters<typeof inngest.send>[0]): Promise<boolean> {
  try {
    await inngest.send(event);
    return true;
  } catch (e) {
    const name = Array.isArray(event) ? event.map((ev) => ev.name).join(",") : event.name;
    console.error(`[sendEvent] failed to queue "${name}":`, e);
    return false;
  }
}
