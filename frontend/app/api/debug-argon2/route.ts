import { NextResponse } from "next/server";
import fs from "node:fs";
import { createRequire } from "node:module";

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

  try {
    // node:module's createRequire builds a fresh require function using
    // Node's own resolution, independent of both webpack's bundling AND
    // Next.js's monkey-patched global require-hook (visible in the plain
    // require's error stack as require-hook.js) — a genuinely different
    // code path than either prior attempt.
    const nodeRequire = createRequire(__filename);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const argon2Native: any = nodeRequire("@node-rs/argon2");
    const hashed: string = await argon2Native.hash("diagnostic-test-password");
    const verified: boolean = await argon2Native.verify(hashed, "diagnostic-test-password");
    info.argon2FunctionalTestCreateRequire = { hashed: hashed.slice(0, 20) + "...", verified };
  } catch (e) {
    info.argon2CallErrorCreateRequire =
      e instanceof Error ? { message: e.message, stack: e.stack?.split("\n").slice(0, 6) } : String(e);
  }

  info.dirname = __dirname;
  info.filename = __filename;

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
