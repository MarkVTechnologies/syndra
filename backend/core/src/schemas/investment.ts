import { z } from "zod";

// PRD §6.3 — drives client form, server action and route handler.
export const CommitInput = z.object({
  opportunityId: z.string().length(24),
  units: z.number().int().positive().max(10_000),
  channel: z.enum(["card", "transfer"]),
});
export type CommitInputType = z.infer<typeof CommitInput>;
