import { NextResponse } from "next/server";
import fs from "node:fs";

export async function GET() {
  const info: Record<string, unknown> = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  };

  try {
    info.argon2ResolvedPath = require.resolve("@node-rs/argon2");
  } catch (e) {
    info.argon2ResolveError = e instanceof Error ? e.message : String(e);
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
