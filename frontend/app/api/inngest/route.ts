import { serve } from "inngest/next";
import { inngest } from "@san/service-notification";
import { notificationFunctions } from "@san/service-notification/inngest";
import { commissionCronFunctions } from "@san/service-commission/cron";
import { investmentCronFunctions } from "@san/service-investment/cron";
import { analyticsCronFunctions } from "@san/service-analytics/cron";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ...notificationFunctions,
    ...commissionCronFunctions,
    ...investmentCronFunctions,
    ...analyticsCronFunctions,
  ],
});
