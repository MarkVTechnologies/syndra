import { NextResponse } from "next/server";
import * as waitlist from "@san/service-waitlist";

/**
 * The launch broadcast's "direct login link" (PRD §13.4). Converts the
 * waitlist row to a real User + Ambassador profile, then routes to /login
 * — never auto-authenticates from a GET link (that would mean handling a
 * session-granting side effect from a bare link click, which is both a
 * CSRF-shaped risk and something email link-scanners can trigger
 * accidentally). The registrant logs in with the password they already set.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loginUrl = new URL("/login", request.url);

  const result = await waitlist.convertViaLaunchToken(token);
  if (!result.ok) {
    loginUrl.searchParams.set("notice", "launch-link-invalid");
    return NextResponse.redirect(loginUrl);
  }

  loginUrl.searchParams.set("email", result.data.email);
  loginUrl.searchParams.set("notice", "launch-converted");
  return NextResponse.redirect(loginUrl);
}
