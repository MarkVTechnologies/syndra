/**
 * Purely decorative line-art overlays — abstract skyline / blueprint-corner
 * strokes at low opacity. `stroke="currentColor"` so a wrapping `text-*`
 * class drives the color from the theme tokens rather than a hardcoded hex.
 * Never carries meaning — always `aria-hidden`.
 */
export function LineArt({
  variant,
  position = "top-right",
  className = "",
}: {
  variant: "skyline" | "blueprint-corner";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  if (variant === "skyline") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 640 220"
        preserveAspectRatio="none"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-full w-full opacity-[0.14] ${className}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path d="M0 220V140H40V90H90V140H120V60H180V140H220V110H260V140H300V40H360V140H400V70H450V140H480V100H540V140H580V50H640V220" />
        <path d="M40 90V70H70V90" />
        <path d="M300 40V20H330V40" />
        <path d="M580 50V30H610V50" />
      </svg>
    );
  }

  const corner: Record<string, string> = {
    "top-left": "top-6 left-6",
    "top-right": "top-6 right-6 -scale-x-100",
    "bottom-left": "bottom-6 left-6 -scale-y-100",
    "bottom-right": "bottom-6 right-6 -scale-x-100 -scale-y-100",
  };

  return (
    <svg
      aria-hidden
      viewBox="0 0 64 64"
      className={`pointer-events-none absolute size-14 opacity-20 ${corner[position]} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M0 20V0H20" />
      <path d="M0 32H8" />
      <path d="M32 0V8" />
      <circle cx="0" cy="0" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
