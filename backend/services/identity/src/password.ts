import bcrypt from "bcryptjs";

// @node-rs/argon2 (native Rust addon) and hash-wasm (WASM) were both tried
// and both hit platform-specific loading failures on Netlify's Next.js
// runtime — the native package's platform binary depends on pnpm symlinks
// Netlify's esbuild-based function bundler doesn't preserve, and even a
// WASM binary embedded in JS carries its own instantiation surface. bcryptjs
// is a pure, synchronous JS implementation with no native binary, no
// platform packages, and no WASM instantiation step — nothing for any
// bundler on any platform to lose track of, at the cost of losing
// interoperability with the argon2 hashes those two approaches produced
// (a different string format, "$2b$..." vs "$argon2id$..."). Safe to switch
// cleanly: the only account seeded so far is the placeholder admin.
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hashStr);
  } catch {
    return false;
  }
}
