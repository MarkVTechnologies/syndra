import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/data/page-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );
}
