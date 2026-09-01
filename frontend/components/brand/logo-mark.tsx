import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one SAN brand mark, used identically everywhere — marketing header,
 * admin/ambassador/syndicator shells, admin-login. Previously each surface
 * hand-rolled its own logo markup with slightly different treatment; this
 * is what "consistent brand across board" actually enforces in code rather
 * than by convention.
 */
export function LogoMark({
  size = "md",
  wordmark = "SAN",
  className,
  textClassName,
}: {
  size?: "sm" | "md";
  wordmark?: string;
  className?: string;
  /** Override the wordmark's text color — e.g. for placement on a dark background. */
  textClassName?: string;
}) {
  const badgeSize = size === "sm" ? "size-7" : "size-8";
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          badgeSize,
          "flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-40 to-rust-20 text-white shadow-[0_2px_12px_rgba(192,88,0,0.35)]"
        )}
      >
        <ShieldCheck className={iconSize} strokeWidth={2.25} />
      </span>
      {wordmark && (
        <span className={cn("font-display font-bold", textSize, textClassName ?? "text-foreground")}>
          {wordmark}
        </span>
      )}
    </span>
  );
}
