import { listAmbassadors } from "@/lib/admin/user-queries";
import { AmbassadorDirectoryTable } from "@/components/admin/ambassador-directory-table";
import { PageHeader } from "@/components/layout/page-header";

export default async function AdminAmbassadorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const result = await listAmbassadors({ page, pageSize: 25, search: params.search });
  const { rows, total } = result.ok ? result.data : { rows: [], total: 0 };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ambassadors" description={`${total} total`} />
      <AmbassadorDirectoryTable rows={rows} total={total} page={page} pageSize={25} />
    </div>
  );
}
