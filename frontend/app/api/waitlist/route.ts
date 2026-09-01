import { NextResponse } from "next/server";
import { submitWaitlist } from "@/lib/waitlist/submit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await submitWaitlist(body);

  if (!result.ok) {
    const status =
      result.error.code === "RATE_LIMITED"
        ? 429
        : result.error.code === "CONFLICT"
          ? 409
          : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}
