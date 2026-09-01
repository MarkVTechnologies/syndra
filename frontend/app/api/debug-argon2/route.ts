import { NextResponse } from "next/server";
import fs from "node:fs";

export async function GET() {
  const info: Record<string, unknown> = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  };

  try {
    info.argon2ResolvedPathPlain = require.resolve("@node-rs/argon2");
  } catch (e) {
    info.argon2ResolveErrorPlain = e instanceof Error ? e.message : String(e);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const argon2: any = require("@node-rs/argon2");
    const hashed: string = await argon2.hash("diagnostic-test-password");
    const verified: boolean = await argon2.verify(hashed, "diagnostic-test-password");
    info.argon2FunctionalTestPlain = { hashed: hashed.slice(0, 20) + "...", verified };
  } catch (e) {
    info.argon2CallErrorPlain = e instanceof Error ? { message: e.message } : String(e);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const argon2Ignored: any = require(/* webpackIgnore: true */ "@node-rs/argon2");
    const hashed: string = await argon2Ignored.hash("diagnostic-test-password");
    const verified: boolean = await argon2Ignored.verify(hashed, "diagnostic-test-password");
    info.argon2FunctionalTestWebpackIgnore = { hashed: hashed.slice(0, 20) + "...", verified };
  } catch (e) {
    info.argon2CallErrorWebpackIgnore = e instanceof Error ? { message: e.message } : String(e);
  }

  const pnpmDir = "/var/task/node_modules/.pnpm";
  try {
    info.pnpmDirEntries = fs
      .readdirSync(pnpmDir)
      .filter((n) => n.toLowerCase().includes("argon2"));
  } catch (e) {
    info.pnpmDirError = e instanceof Error ? e.message : String(e);
  }

  const frontendPnpmDir = "/var/task/frontend/node_modules/.pnpm";
  try {
    info.frontendPnpmDirEntries = fs
      .readdirSync(frontendPnpmDir)
      .filter((n) => n.toLowerCase().includes("argon2"));
  } catch (e) {
    info.frontendPnpmDirError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}
