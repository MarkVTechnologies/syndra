import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/data/page-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );
}
