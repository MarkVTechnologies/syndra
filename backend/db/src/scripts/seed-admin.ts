/**
 * Seeds the platform's first admin account and the settings singleton.
 * Credentials come from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD and MUST be
 * rotated at first login (PRD §13.3, §15.1).
 */
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
loadEnv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../.env") });

import { randomBytes } from "node:crypto";
import { argon2id } from "hash-wasm";
import { getEnv } from "@san/core/env";
import { connectDb, mongoose, UserModel, getSettings } from "../index";

async function main() {
  const env = getEnv();
  await connectDb();

  const existing = await UserModel.findOne({ email: env.ADMIN_SEED_EMAIL });
  if (existing) {
    console.log(`Admin ${env.ADMIN_SEED_EMAIL} already exists — skipping.`);
  } else {
    const passwordHash = await argon2id({
      password: env.ADMIN_SEED_PASSWORD,
      salt: randomBytes(16),
      memorySize: 19456,
      iterations: 2,
      parallelism: 1,
      hashLength: 32,
      outputType: "encoded",
    });
    await UserModel.create({
      email: env.ADMIN_SEED_EMAIL,
      passwordHash,
      role: "admin",
      status: "active",
      emailVerifiedAt: new Date(),
    });
    console.log(`Seeded admin account: ${env.ADMIN_SEED_EMAIL}`);
  }

  await getSettings();
  console.log("Settings singleton ensured.");

  await mongoose.connection.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
