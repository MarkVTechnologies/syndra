import type { hash, verify } from "@node-rs/argon2";
import { createRequire } from "node:module";

// serverExternalPackages (frontend/next.config.ts), a manual
// webpack.externals override, and a call-site `webpackIgnore` magic comment
// were all tried and none reliably held under Netlify's Next.js runtime.
// Confirmed via a live diagnostic route: the real native files were present
// on disk in the deployment, but even a webpackIgnore'd require still went
// through Next.js's own monkey-patched global require-hook
// (next/dist/server/require-hook.js, visible in the failing stack trace),
// which failed to resolve this native module when called from certain
// routes. `createRequire` builds an independent require function using
// Node's own module resolution directly, bypassing both webpack's bundling
// and Next's global require-hook patching entirely.
const nodeRequire = createRequire(__filename);
const argon2 = nodeRequire("@node-rs/argon2") as {
  hash: typeof hash;
  verify: typeof verify;
};

// OWASP 2024 baseline, per PRD §12.1.
const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hashStr, plain);
  } catch {
    return false;
  }
}
