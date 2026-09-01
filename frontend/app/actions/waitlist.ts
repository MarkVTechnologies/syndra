"use server";

import type { Result } from "@san/core/result";
import type { WaitlistSuccess } from "@san/service-waitlist";
import { submitWaitlist } from "@/lib/waitlist/submit";

export async function registerAmbassadorAction(raw: unknown): Promise<Result<WaitlistSuccess>> {
  return submitWaitlist(raw);
}
