"use client";

import { useState, useTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Search, Download, Mail, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { WaitlistRow } from "@/lib/admin/waitlist-queries";
import { resendWaitlistConfirmation, flagWaitlistSpam } from "@/app/actions/admin-waitlist";

const columnHelper = createColumnHelper<WaitlistRow>();

const columns = [
  columnHelper.accessor("fullName", { header: "Name" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("phone", { header: "Phone" }),
  columnHelper.accessor((r) => `${r.city}, ${r.state}`, { id: "location", header: "Location" }),
  columnHelper.accessor("yearsExperience", { header: "Experience" }),
  columnHelper.accessor("desiredSlug", {
    header: "Slug",
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor("createdAt", {
    header: "Registered",
    cell: (info) => new Date(info.getValue()).toLocaleDateString("en-NG", { day: "2-digit", month: "short" }),
  }),
];

export function WaitlistTable({
  initialRows,
  total,
  page,
  pageSize,
}: {
  initialRows: WaitlistRow[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();

  const table = useReactTable({
    data: initialRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const pushParams = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ search, page: "1" });
  };

  const handleResend = (id: string) => {
    toast.promise(resendWaitlistConfirmation(id), {
      loading: "Resending...",
      success: "Confirmation email resent",
      error: "Failed to resend",
    });
  };

  const handleFlag = (id: string) => {
    toast.promise(flagWaitlistSpam(id, true), {
      loading: "Flagging...",
      success: "Flagged as spam",
      error: "Failed to flag",
    });
  };

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={onSearchSubmit} className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, slug"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <a href={`/api/export/waitlist${search ? `?search=${encodeURIComponent(search)}` : ""}`}>
          <Button variant="secondary" size="sm">
            <Download className="size-4" /> Export CSV
          </Button>
        </a>
      </div>

      {/* Desktop table */}
      <div className={`hidden overflow-x-auto md:block ${isPending ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border text-left text-xs text-muted-foreground">
                {hg.headers.map((h) => (
                  <th key={h.id} className="px-4 py-3 font-medium">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <RowActions id={row.original.id} onResend={handleResend} onFlag={handleFlag} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — stacked cards, PRD §11.1 */}
      <div className="flex flex-col gap-3 p-3 md:hidden">
        {initialRows.map((r) => (
          <div key={r.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{r.fullName}</p>
                <p className="text-xs text-muted-foreground">{r.email}</p>
              </div>
              <RowActions id={r.id} onResend={handleResend} onFlag={handleFlag} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge>{r.city}, {r.state}</Badge>
              <Badge>{r.yearsExperience} yrs</Badge>
              <Badge variant="brass">syndran.com/{r.desiredSlug}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
        <span>
          Page {page} of {pageCount} &middot; {total} total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => pushParams({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => pushParams({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RowActions({
  id,
  onResend,
  onFlag,
}: {
  id: string;
  onResend: (id: string) => void;
  onFlag: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Row actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onResend(id)}>
          <Mail className="size-4" /> Resend confirmation
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFlag(id)} className="text-danger">
          <Flag className="size-4" /> Flag as spam
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
