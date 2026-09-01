"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, CheckCircle2, Ban, RotateCcw } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Card } from "@/components/ui/card";
import { fmt, type Minor } from "@san/core/money";
import type { AmbassadorRow } from "@/lib/admin/user-queries";
import {
  approveAmbassadorAction,
  suspendUserAction,
  reactivateUserAction,
} from "@/app/actions/admin-users";

export function AmbassadorDirectoryTable({
  rows,
  total,
  page,
  pageSize,
}: {
  rows: AmbassadorRow[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [detail, setDetail] = useState<AmbassadorRow | null>(null);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const pushPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const runAction = (fn: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>, id: string, label: string) => {
    toast.promise(fn(id), {
      loading: `${label}...`,
      success: `${label} done`,
      error: (e) => e?.error?.message ?? `Failed to ${label.toLowerCase()}`,
    });
  };

  return (
    <>
      <Card>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Earned</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.userId}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-muted"
                  onClick={() => setDetail(r)}
                >
                  <td className="px-4 py-3 text-foreground">{r.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.slug ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 font-medium tabular-nums text-brass-600">
                    {fmt(r.totalEarnedMinor as Minor)}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowActions row={r} onAction={runAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 p-3 md:hidden">
          {rows.map((r) => (
            <button
              key={r.userId}
              onClick={() => setDetail(r)}
              className="rounded-lg border border-border p-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{r.fullName}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
          <span>Page {page} of {pageCount} &middot; {total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => pushPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => pushPage(page + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <BottomSheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.fullName}>
        {detail && (
          <div className="flex flex-col gap-3">
            <Row label="Email" value={detail.email} />
            <Row label="Slug" value={detail.slug ?? "Not claimed"} />
            <Row label="Location" value={detail.city ? `${detail.city}, ${detail.state}` : "—"} />
            <Row label="Status" value={<StatusBadge status={detail.status} />} />
            <Row label="Total earned" value={fmt(detail.totalEarnedMinor as Minor)} />
            <div className="mt-3 flex gap-2">
              {detail.status === "pending_approval" && (
                <Button className="flex-1" onClick={() => runAction(approveAmbassadorAction, detail.userId, "Approve")}>
                  <CheckCircle2 className="size-4" /> Approve
                </Button>
              )}
              {detail.status !== "suspended" ? (
                <Button variant="destructive" className="flex-1" onClick={() => runAction(suspendUserAction, detail.userId, "Suspend")}>
                  <Ban className="size-4" /> Suspend
                </Button>
              ) : (
                <Button className="flex-1" onClick={() => runAction(reactivateUserAction, detail.userId, "Reactivate")}>
                  <RotateCcw className="size-4" /> Reactivate
                </Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function RowActions({
  row,
  onAction,
}: {
  row: AmbassadorRow;
  onAction: (fn: (id: string) => Promise<{ ok: boolean; error?: { message: string } }>, id: string, label: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Row actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {row.status === "pending_approval" && (
          <DropdownMenuItem onClick={() => onAction(approveAmbassadorAction, row.userId, "Approve")}>
            <CheckCircle2 className="size-4" /> Approve
          </DropdownMenuItem>
        )}
        {row.status !== "suspended" ? (
          <DropdownMenuItem onClick={() => onAction(suspendUserAction, row.userId, "Suspend")} className="text-danger">
            <Ban className="size-4" /> Suspend
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onAction(reactivateUserAction, row.userId, "Reactivate")}>
            <RotateCcw className="size-4" /> Reactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: "success" | "warning" | "danger" | "neutral" =
    status === "active" ? "success" : status === "suspended" ? "danger" : status === "pending_approval" ? "warning" : "neutral";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
