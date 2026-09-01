import { cn } from "@/lib/utils";

function initialsFrom(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? [parts[0]?.[0], parts[1]?.[0]] : [local[0], local[1]];
  return chars.filter(Boolean).join("").toUpperCase();
}

/** Small initials avatar sharing LogoMark's brand-gradient badge, for shell footers. */
export function UserAvatar({ email, className }: { email: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-40 to-rust-20 text-xs font-semibold text-white shadow-[0_2px_12px_rgba(192,88,0,0.35)]",
        className
      )}
    >
      {initialsFrom(email)}
    </span>
  );
}
