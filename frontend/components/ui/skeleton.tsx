import { cn } from "@/lib/utils";

/** Skeletons, never spinners — shaped to match final layout. PRD §10.5. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-muted", className)}
      {...props}
    />
  );
}
