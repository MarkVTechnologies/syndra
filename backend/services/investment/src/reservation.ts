import { OpportunityModel, mongoose } from "@san/db";

export const RESERVATION_MINUTES = 30;

/**
 * Atomically reserves units via a single conditional update — no
 * transaction needed for this step alone, MongoDB's per-document atomicity
 * is sufficient. Returns the updated opportunity iff there was room;
 * returns null (caller treats as ALLOCATION_EXCEEDED) otherwise. PRD §3.4 /
 * §14 Day 4 Block 1.
 */
export async function reserveUnits(opportunityId: string, units: number) {
  return OpportunityModel.findOneAndUpdate(
    {
      _id: opportunityId,
      status: "published",
      deletedAt: null,
      $expr: {
        $lte: [{ $add: ["$pricing.unitsSold", "$pricing.reservedUnits", units] }, "$pricing.totalUnits"],
      },
    },
    { $inc: { "pricing.reservedUnits": units } },
    { new: true }
  );
}

export async function releaseReservation(opportunityId: string, units: number) {
  await OpportunityModel.updateOne(
    { _id: opportunityId },
    { $inc: { "pricing.reservedUnits": -units } }
  );
}

/** Moves units from "reserved" to "sold" — called inside the confirm transaction. */
export async function commitReservationToSale(
  opportunityId: string,
  units: number,
  session: mongoose.ClientSession
) {
  await OpportunityModel.updateOne(
    { _id: opportunityId },
    { $inc: { "pricing.reservedUnits": -units, "pricing.unitsSold": units } },
    { session }
  );
}
