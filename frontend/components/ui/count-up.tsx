"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { fmt, type Minor } from "@san/core/money";

export type CountUpFormat = "percent" | "money";

// A function prop can't cross the Server->Client Component boundary (every
// caller here is a Server Component page), so formatting is a fixed keyword
// resolved to a formatter client-side instead of an arbitrary callback.
function applyFormat(n: number, format?: CountUpFormat): string {
  const rounded = Math.round(n);
  if (format === "percent") return `${rounded}%`;
  if (format === "money") return fmt(rounded as Minor);
  return rounded.toLocaleString();
}

export function CountUp({
  value,
  className,
  format,
  duration = 0.52,
}: {
  value: number;
  className?: string;
  format?: CountUpFormat;
  duration?: number;
}) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => applyFormat(v, format));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, motionValue, duration]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {rounded}
    </motion.span>
  );
}
