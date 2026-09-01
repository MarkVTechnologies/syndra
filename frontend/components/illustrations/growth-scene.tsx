/**
 * Abstract skyline + ascending growth line — the recurring "investment
 * scene" motif used as a decorative backdrop behind welcome banners and
 * hero-style headers across the app. Pure inline SVG (no external assets),
 * colored via the brand gradient so it always matches the current theme.
 */
export function GrowthScene({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="growth-scene-line" x1="0" y1="220" x2="480" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--san-rust-20)" />
          <stop offset="100%" stopColor="var(--san-amber-40)" />
        </linearGradient>
        <linearGradient id="growth-scene-fill" x1="0" y1="0" x2="0" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--san-amber-40)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--san-amber-40)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Skyline */}
      <g opacity="0.5">
        <rect x="20" y="140" width="26" height="70" rx="2" fill="var(--san-espresso-80)" />
        <rect x="54" y="110" width="22" height="100" rx="2" fill="var(--san-espresso-70)" />
        <rect x="84" y="150" width="30" height="60" rx="2" fill="var(--san-espresso-80)" />
        <rect x="122" y="95" width="20" height="115" rx="2" fill="var(--san-espresso-70)" />
        <rect x="150" y="130" width="24" height="80" rx="2" fill="var(--san-espresso-80)" />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={60 + col * 8}
              y={120 + row * 18}
              width="5"
              height="8"
              rx="1"
              fill="var(--san-cream-90)"
            />
          ))
        )}
      </g>

      {/* Ascending growth line + area fill */}
      <path
        d="M0 190 L70 165 L140 175 L210 120 L280 135 L350 70 L420 85 L480 30"
        stroke="url(#growth-scene-line)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 190 L70 165 L140 175 L210 120 L280 135 L350 70 L420 85 L480 30 L480 220 L0 220 Z"
        fill="url(#growth-scene-fill)"
      />

      {/* Marker dots along the line */}
      {[
        [0, 190],
        [140, 175],
        [280, 135],
        [420, 85],
        [480, 30],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.5" fill="var(--san-amber-40)" stroke="white" strokeWidth="2" />
      ))}
    </svg>
  );
}
