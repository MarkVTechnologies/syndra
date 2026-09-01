import type { hash, verify } from "@node-rs/argon2";

// serverExternalPackages (frontend/next.config.ts) and a manual
// webpack.externals override were both supposed to keep this native-binary
// package a genuine runtime require, never bundled — reached through this
// transpiled workspace package (@san/service-identity), neither reliably
// held under Netlify's Next.js runtime specifically. Confirmed via a live
// diagnostic route: the real native files were present on disk in the
// deployment, but webpack still wrapped the require in a shared chunk keyed
// to whichever page first pulled it in, and Next's custom require-hook
// failed to resolve that chunk's files when a *different* route (this
// function is called from several: login, signup, admin actions...)
// invoked the same shared reference — a resolution-plumbing failure, not a
// missing-file one. The webpackIgnore magic comment is a hard instruction
// to webpack's parser to leave this specific call alone at the exact call
// site, rather than a global config that has to correctly propagate
// through Next's config-merging and a third-party runtime's build plugin.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const argon2 = require(/* webpackIgnore: true */ "@node-rs/argon2") as {
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
