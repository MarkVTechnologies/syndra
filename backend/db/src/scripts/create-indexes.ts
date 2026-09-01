/**
 * Explicit index sync. autoIndex is disabled in production (index builds
 * should never happen implicitly on a hot request path), so this script is
 * the only place indexes are created/synced. Run via `pnpm db:indexes`.
 * PRD §6.1 — every foreign key indexed, every list query covered.
 */
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../.env") });

import { connectDb, mongoose } from "../client";
import {
  UserModel,
  SessionModel,
  VerificationTokenModel,
  WaitlistModel,
  EmailLogModel,
  AuditLogModel,
  AmbassadorModel,
  SyndicatorModel,
  OpportunityModel,
  ListingModel,
  InvestmentModel,
  CommissionModel,
  PayoutModel,
  EventModel,
  SettingsModel,
} from "../index";

const MODELS = [
  UserModel,
  SessionModel,
  VerificationTokenModel,
  WaitlistModel,
  EmailLogModel,
  AuditLogModel,
  AmbassadorModel,
  SyndicatorModel,
  OpportunityModel,
  ListingModel,
  InvestmentModel,
  CommissionModel,
  PayoutModel,
  EventModel,
  SettingsModel,
];

async function main() {
  await connectDb();
  for (const m of MODELS) {
    console.log(`Syncing indexes for ${m.modelName}...`);
    const result = await m.syncIndexes();
    console.log(`  -> ${result.length ? result.join(", ") : "up to date"}`);
  }
  console.log("Done.");
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
