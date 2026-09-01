import { NextResponse } from "next/server";
import { killSessionByToken } from "@san/service-identity";

/** Public, no auth required — that's the point of a kill-session link. PRD §9.2. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const loginUrl = new URL("/login", request.url);
  if (!token) {
    loginUrl.searchParams.set("notice", "invalid-link");
    return NextResponse.redirect(loginUrl);
  }

  const result = await killSessionByToken(token);
  loginUrl.searchParams.set("notice", result.ok ? "session-killed" : "link-expired");
  return NextResponse.redirect(loginUrl);
}
