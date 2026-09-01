import { randomBytes } from "node:crypto";
import { argon2id, argon2Verify } from "hash-wasm";

// @node-rs/argon2 (a native Rust addon) was tried first and failed
// specifically on Netlify: its platform binary depends on pnpm's symlink
// layout (a top-level node_modules/@node-rs/argon2 symlink into the pnpm
// content-addressable store, itself containing a further nested symlink to
// the platform-specific binding package), and Netlify's esbuild-based
// function bundler does not preserve either symlink — confirmed via a live
// diagnostic route showing the real files present on disk but every
// require() path (bare specifier, webpackIgnore'd, node:module
// createRequire, even a direct require of the resolved CAS path) failing
// with "Cannot find module". hash-wasm has no native binary and no
// platform packages — its WASM bytes are embedded directly in its JS, so
// there is nothing for any bundler to lose track of. It produces standard
// PHC-format argon2id strings, so it verifies hashes the native library
// already produced without any migration.
const ARGON2_OPTS = { memorySize: 19456, iterations: 2, parallelism: 1, hashLength: 32 } as const;

// OWASP 2024 baseline, per PRD §12.1.
export async function hashPassword(plain: string): Promise<string> {
  return argon2id({
    password: plain,
    salt: randomBytes(16),
    ...ARGON2_OPTS,
    outputType: "encoded",
  });
}

export async function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await argon2Verify({ password: plain, hash: hashStr });
  } catch {
    return false;
  }
}
