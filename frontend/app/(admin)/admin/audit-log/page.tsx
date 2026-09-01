import { listAuditLogs } from "@san/service-analytics";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyStateIllustration } from "@/components/illustrations/empty-state";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const result = await listAuditLogs({ page, pageSize: 50 });
  const { rows, total } = result.ok ? result.data : { rows: [], total: 0 };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description={`${total} events. Append-only — entries cannot be edited or deleted. PRD §12.5.`}
      />

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Badge>{r.action}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">
                  {r.targetType}:{r.targetId.slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.actorRole}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.ip ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("en-NG")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <EmptyStateIllustration className="h-24 w-28" />
                    <p className="text-sm text-muted-foreground">No events yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
