import { Card } from "@/components/ui/card";
import { CountUp, type CountUpFormat } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  format,
}: {
  label: string;
  value: number;
  icon?: LucideIcon;
  accent?: boolean;
  format?: CountUpFormat;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-[clamp(1.5rem,2vw+1rem,2rem)] font-bold tabular-nums",
          accent ? "text-brass-600" : "text-foreground"
        )}
      >
        <CountUp value={value} format={format} />
      </p>
    </Card>
  );
}
