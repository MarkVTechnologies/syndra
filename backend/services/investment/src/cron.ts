import { inngest } from "@san/service-notification";
import { releaseExpiredReservations } from "./index";

/** TTL release job — PRD §14 Day 4 Block 1. Every 5 minutes. */
export const releaseExpiredReservationsCron = inngest.createFunction(
  { id: "investment-release-expired-reservations" },
  { cron: "*/5 * * * *" },
  async () => {
    const result = await releaseExpiredReservations();
    return { released: result.ok ? result.data : 0 };
  }
);

export const investmentCronFunctions = [releaseExpiredReservationsCron];
