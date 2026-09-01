import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Monorepo convention: the canonical .env lives at the repo root (used by
// backend scripts too), not inside frontend/ — Next.js only auto-loads its
// own project root, so load it explicitly before anything reads process.env.
loadEnv({ path: "../.env" });

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Native binary (@node-rs/argon2) must stay a real require() at runtime,
  // never webpack-bundled — Next's bundler can't parse a .node file.
  serverExternalPackages: [
    "@node-rs/argon2",
    "@node-rs/argon2-win32-x64-msvc",
    "mongoose",
  ],
  transpilePackages: [
    "@san/core",
    "@san/db",
    "@san/email",
    "@san/service-identity",
    "@san/service-waitlist",
    "@san/service-notification",
    "@san/service-analytics",
    "@san/service-ambassador",
    "@san/service-syndicator",
    "@san/service-catalog",
    "@san/service-investment",
    "@san/service-commission",
  ],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // /admin/login is served by app/admin-login/page.tsx (not
  // app/(admin)/admin/login/) so it never inherits admin/layout.tsx's
  // "redirect unauthenticated visitors away" guard — that guard is exactly
  // what an admin-only *login* page must not be subject to. The rewrite
  // keeps the public URL as /admin/login while routing to a page outside
  // that protected segment tree; middleware.ts separately excludes the
  // literal path from its RBAC gate.
  async rewrites() {
    return [{ source: "/admin/login", destination: "/admin-login" }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { isServer }) => {
    // serverExternalPackages doesn't reliably externalize a native binary
    // reached through a transpiled workspace package (@san/service-identity
    // is in transpilePackages above) — force it here so webpack never tries
    // to parse the .node file as a module.
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      externals.push({
        "@node-rs/argon2": "commonjs @node-rs/argon2",
        "@node-rs/argon2-win32-x64-msvc": "commonjs @node-rs/argon2-win32-x64-msvc",
      });
      config.externals = externals;
      // MongoDB driver's optional auth/compression backends — never
      // installed, safe to no-op when webpack statically probes for them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        aws4: false,
        "mongodb-client-encryption": false,
        kerberos: false,
        "@mongodb-js/zstd": false,
        snappy: false,
        socks: false,
        "@aws-sdk/credential-providers": false,
      };
    }
    return config;
  },
};

export default withSerwist(nextConfig);
