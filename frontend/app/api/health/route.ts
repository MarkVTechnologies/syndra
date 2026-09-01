import { NextResponse } from "next/server";
import { connectDb, mongoose } from "@san/db";
import { Redis } from "@upstash/redis";
import { getEnv } from "@san/core/env";

export async function GET() {
  const checks: Record<string, boolean> = {};

  try {
    await connectDb();
    await mongoose.connection.db?.admin().ping();
    checks.mongo = true;
  } catch {
    checks.mongo = false;
  }

  try {
    const env = getEnv();
    const redis = new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN });
    await redis.ping();
    checks.redis = true;
  } catch {
    checks.redis = false;
  }

  const healthy = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      sha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
