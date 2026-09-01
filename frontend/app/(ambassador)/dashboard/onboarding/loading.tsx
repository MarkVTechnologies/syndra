import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-lg py-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-48" />
      <Skeleton className="mt-6 h-80 w-full rounded-2xl" />
    </div>
  );
}
