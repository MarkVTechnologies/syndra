// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "@next/eslint-plugin-next";

/**
 * BOUNDARY ENFORCEMENT (PRD §4.4). Two rules keep the "microservice-ready"
 * claim honest:
 *  1. A service package may only import another service's public entry
 *     point (its package name), never a relative path into its `src/`.
 *  2. frontend/ may not import @san/db directly — it must go through a
 *     service. The single infra exception is the health-check ping, which
 *     genuinely is not domain logic.
 */
const serviceInternalsGuard = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@san/service-*/src/*", "**/services/*/src/**"],
            message: "Import another service's public interface (its package export), not its internals.",
          },
        ],
      },
    ],
  },
};

const frontendDbGuard = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@san/db",
            message: "frontend/ must go through a @san/service-* package, not @san/db directly (PRD §4.4).",
          },
        ],
      },
    ],
  },
};

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "frontend/public/**",
      "frontend/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["backend/services/**/src/**/*.ts"],
    ...serviceInternalsGuard,
  },
  {
    files: ["frontend/**/*.{ts,tsx}"],
    plugins: { "@next/next": next },
    rules: {
      ...next.configs["core-web-vitals"].rules,
    },
  },
  {
    files: ["frontend/**/*.{ts,tsx}"],
    ignores: ["frontend/app/api/health/route.ts"],
    ...frontendDbGuard,
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
