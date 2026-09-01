import { NextResponse } from "next/server";
import { track } from "@san/service-analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, hashIp } from "@/lib/request-context";

/** Fire-and-forget analytics beacon. 202 Accepted, never blocks. PRD §7.1. */
export async function POST(request: Request) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("track", ip, 60, 60);
  if (!allowed) return new NextResponse(null, { status: 202 });

  const body = await request.json().catch(() => null);
  if (body && typeof body.name === "string") {
    void track({
      name: body.name,
      ambassadorId: body.ambassadorId ?? null,
      props: body.props ?? {},
      sessionId: body.sessionId ?? null,
      ipHash: hashIp(ip),
      ua: request.headers.get("user-agent"),
    });
  }

  return new NextResponse(null, { status: 202 });
}
