import { connectDb, UserModel } from "@san/db";
import { getEnv } from "@san/core/env";
import { inngest, sendEvent } from "@san/service-notification";
import { getDigestStats } from "./index";

/** Daily digest to every active admin — PRD §9.2. 07:00 WAT (06:00 UTC). */
export const adminDigestCron = inngest.createFunction(
  { id: "analytics-admin-digest" },
  { cron: "0 6 * * *" },
  async () => {
    await connectDb();
    const env = getEnv();
    const [statsResult, admins] = await Promise.all([
      getDigestStats(),
      UserModel.find({ role: "admin", status: "active" }).select("email").lean(),
    ]);
    if (!statsResult.ok) return { sent: 0 };

    const date = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
    // sendEvent() is fail-open per admin — one bad send must not stop the
    // rest of the admin list from getting their digest.
    let sent = 0;
    for (const admin of admins) {
      const ok = await sendEvent({
        name: "admin/digest",
        data: {
          adminEmail: admin.email,
          date,
          ...statsResult.data,
          adminUrl: `${env.NEXT_PUBLIC_APP_URL}/admin`,
        },
      });
      if (ok) sent++;
    }
    return { sent, total: admins.length };
  }
);

export const analyticsCronFunctions = [adminDigestCron];
