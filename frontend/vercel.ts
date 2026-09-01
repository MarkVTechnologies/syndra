import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "cd .. && pnpm turbo run build --filter=@san/frontend",
  installCommand: "cd .. && pnpm install --frozen-lockfile",
};
