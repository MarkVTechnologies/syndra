import { PageSkeleton } from "@/components/data/page-skeleton";

export default function Loading() {
  return <PageSkeleton kpis={0} rows={10} />;
}
