import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/auth";
import { getCloudinaryConfig } from "@san/service-settings";

const ALLOWED_FOLDERS = ["opportunities", "avatars"] as const;

/**
 * Returns a short-lived Cloudinary signature. Folder and allowed formats
 * are server-fixed — the client cannot choose them. Bytes never touch our
 * runtime; the browser uploads directly to Cloudinary. PRD §7.1 / §12.3.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "ambassador")) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const folder = ALLOWED_FOLDERS.includes(body?.folder) ? body.folder : "opportunities";

  if (folder === "opportunities" && session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const cloudinary = await getCloudinaryConfig();
  if (!cloudinary.apiSecret || !cloudinary.apiKey || !cloudinary.cloudName) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: "Media uploads are not configured yet" } },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${cloudinary.apiSecret}`;
  const signature = createHash("sha1").update(paramsToSign).digest("hex");

  return NextResponse.json({
    ok: true,
    data: {
      signature,
      timestamp,
      folder,
      apiKey: cloudinary.apiKey,
      cloudName: cloudinary.cloudName,
    },
  });
}
