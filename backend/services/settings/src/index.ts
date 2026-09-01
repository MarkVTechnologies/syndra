import {
  getIntegrationStatus as dbGetIntegrationStatus,
  updateIntegrationSettings as dbUpdateIntegrationSettings,
  type IntegrationStatus,
  type IntegrationUpdateInput,
} from "@san/db";
import { ok, type Result } from "@san/core/result";
import { audit } from "@san/service-analytics";

export type { IntegrationStatus, IntegrationFieldStatus, IntegrationUpdateInput } from "@san/db";

// Resolvers other server-side code (route handlers, other services) needs
// at the point of actually calling an integration — re-exported here since
// frontend/ can't import @san/db directly (PRD §4.4 boundary rule) and
// these don't need the audit-trail wrapping the update path gets.
export { getCloudinaryConfig, getPaystackConfig, getTurnstileConfig, getResendConfig } from "@san/db";

/**
 * Owns: admin-entered integration credentials (Resend, Cloudinary,
 * Paystack, Turnstile). Thin wrapper over @san/db/integrations — its only
 * job beyond the DB layer is the audit trail, since frontend/ isn't
 * allowed to import @san/db directly (PRD §4.4 boundary rule).
 */

export async function getIntegrationStatus(): Promise<Result<IntegrationStatus>> {
  return ok(await dbGetIntegrationStatus());
}

export async function updateIntegrationSettings(
  input: IntegrationUpdateInput,
  actorId: string
): Promise<Result<{ updatedFields: string[] }>> {
  const updatedFields = await dbUpdateIntegrationSettings(input);

  if (updatedFields.length > 0) {
    await audit({
      actorId,
      actorRole: "admin",
      action: "settings.integrations_updated",
      targetType: "settings",
      targetId: "singleton",
      // Field NAMES only — never values. This is exactly why real secrets
      // must never be logged: the whole point of an audit trail is that
      // more people can read it than should ever see the credential itself.
      after: { updatedFields },
    });
  }

  return ok({ updatedFields });
}
