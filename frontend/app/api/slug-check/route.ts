import { NextResponse } from "next/server";
import { checkSlugAvailable } from "@san/service-waitlist";
import { SlugCheckQuery, RESERVED_SLUGS } from "@san/core/schemas/waitlist";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";

export async function GET(request: Request) {
  const ip = await getClientIp();
  const { allowed } = await checkRateLimit("slug-check", ip, 20, 60);
  if (!allowed) {
    return NextResponse.json({ available: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = SlugCheckQuery.safeParse({ slug: searchParams.get("slug") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ available: false, error: "INVALID" }, { status: 400 });
  }
  const { slug } = parsed.data;

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  // Ambassador-slug collisions are checked once @san/service-ambassador owns
  // claimSlug() in Day 3; waitlist reservations are checked here today.
  const available = await checkSlugAvailable(slug);
  return NextResponse.json({ available });
}
