import { NextResponse } from "next/server";
import { streamAll } from "@san/service-waitlist";
import { adminListPayouts } from "@san/service-commission";
import { audit } from "@san/service-analytics";
import { auth } from "@/auth";

function toCsvRow(values: (string | number)[]): string {
  return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\r\n";
}

const WAITLIST_HEADER = [
  "fullName", "email", "phone", "whatsapp", "city", "state",
  "yearsExperience", "desiredSlug", "source", "status", "createdAt",
];

const PAYOUTS_HEADER = ["ambassadorName", "amountMinor", "status", "requestedAt"];

async function exportWaitlist(search: string | undefined): Promise<NextResponse> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(toCsvRow(WAITLIST_HEADER)));
      for await (const doc of streamAll(search)) {
        controller.enqueue(
          encoder.encode(
            toCsvRow([
              doc.fullName, doc.email, doc.phone, doc.whatsapp, doc.city, doc.state,
              doc.yearsExperience, doc.desiredSlug, doc.source ?? "landing", doc.status,
              doc.createdAt?.toISOString() ?? "",
            ])
          )
        );
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="waitlist-${Date.now()}.csv"`,
    },
  });
}

async function exportPayouts(status: string | undefined): Promise<NextResponse> {
  const result = await adminListPayouts(status);
  const rows = result.ok ? result.data : [];

  let csv = toCsvRow(PAYOUTS_HEADER);
  for (const p of rows) {
    csv += toCsvRow([p.ambassadorName, p.amountMinor, p.status, p.requestedAt]);
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="payouts-${Date.now()}.csv"`,
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  const { entity } = await params;
  const { searchParams } = new URL(request.url);

  if (entity !== "waitlist" && entity !== "payouts") {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: `Export for "${entity}" lands with its module (see PRD §14)` } },
      { status: 404 }
    );
  }

  await audit({
    actorId: session.user.id,
    actorRole: "admin",
    action: "export.csv",
    targetType: entity,
    targetId: "filtered",
  });

  if (entity === "payouts") {
    return exportPayouts(searchParams.get("status") ?? undefined);
  }

  return exportWaitlist(searchParams.get("search") ?? undefined);
}
