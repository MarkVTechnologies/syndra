import { GrowthScene } from "@/components/illustrations/growth-scene";
import { cn } from "@/lib/utils";

/**
 * The shared "welcome" hero banner for every authenticated dashboard
 * (ambassador overview, admin overview, syndicator portfolio) — same
 * gradient, same growth-scene illustration, same sweep treatment, so the
 * three surfaces read as one product rather than three different apps.
 */
export function WelcomeBanner({
  eyebrow,
  title,
  subtitle,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-surface-elevated p-6 sm:p-8",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(420px circle at 85% 0%, rgba(221,108,16,0.18), transparent 65%)",
        }}
      />
      <div aria-hidden className="texture-ledger-dark absolute inset-0 opacity-40" />
      <GrowthScene
        aria-hidden
        className="pointer-events-none absolute -bottom-4 -right-4 h-[140px] w-[300px] opacity-60 sm:h-[180px] sm:w-[420px]"
      />
      <div className="sweep sweep-dark absolute inset-0 opacity-60" />

      <div className="relative">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--estate-amber-300)]">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{subtitle}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}
