import { connectDb, UserModel } from "@san/db";
import { getEnv } from "@san/core/env";
import { inngest, sendEvent } from "@san/service-notification";
import { markPayable, reconcileAll } from "./index";

/** pending -> payable once the cooling period elapses. PRD §8.3. Hourly. */
export const commissionMatureCron = inngest.createFunction(
  { id: "commission-mature" },
  { cron: "0 * * * *" },
  async () => {
    const result = await markPayable(new Date());
    return { movedToPayable: result.ok ? result.data : 0 };
  }
);

/**
 * Nightly ledger reconciliation (PRD §8.4 / Day 5 Block 8). The ledger is
 * always the source of truth; this only flags a cached-counter drift for a
 * human to look at — it never auto-corrects a balance. 01:00 WAT (00:00 UTC),
 * off-peak and clear of the hourly maturation cron.
 */
export const reconciliationCron = inngest.createFunction(
  { id: "commission-reconciliation", retries: 2 },
  { cron: "0 0 * * *" },
  async () => {
    const result = await reconcileAll();
    if (!result.ok || result.data.length === 0) return { drifted: 0 };

    await connectDb();
    const env = getEnv();
    const admins = await UserModel.find({ role: "admin", status: "active" }).select("email").lean();
    const date = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

    // sendEvent() is fail-open per admin — one bad send must not stop the
    // rest of the admin list from being alerted to the drift.
    let notified = 0;
    for (const admin of admins) {
      const ok = await sendEvent({
        name: "commission/reconciliation_drift",
        data: {
          adminEmail: admin.email,
          date,
          drifts: result.data,
          adminUrl: `${env.NEXT_PUBLIC_APP_URL}/admin`,
        },
      });
      if (ok) notified++;
    }

    return { drifted: result.data.length, notified };
  }
);

export const commissionCronFunctions = [commissionMatureCron, reconciliationCron];
