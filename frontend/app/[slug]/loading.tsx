import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/container";
import { CardGridSkeleton } from "@/components/data/page-skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background pb-28">
      <section className="bg-[var(--san-obsidian-950)] pb-10 pt-16">
        <Container className="flex flex-col items-center">
          <Skeleton className="size-24 rounded-full" />
          <Skeleton className="mt-4 h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </Container>
      </section>
      <Container className="py-10">
        <CardGridSkeleton count={3} />
      </Container>
    </div>
  );
}
