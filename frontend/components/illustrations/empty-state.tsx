/**
 * Friendly "nothing here yet" doodle — a coin stack in an open vault/box.
 * Reused across every dashboard's empty states (no investments, no
 * payouts, no referrals yet) instead of each page inventing its own.
 */
export function EmptyStateIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="empty-coin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--san-amber-50)" />
          <stop offset="100%" stopColor="var(--san-amber-40)" />
        </linearGradient>
      </defs>

      {/* Open box */}
      <path d="M20 78 L80 60 L140 78 L140 112 L80 130 L20 112 Z" fill="var(--san-cream-80)" stroke="var(--san-espresso-40)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 78 L80 96 L140 78" stroke="var(--san-espresso-40)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 96 L80 130" stroke="var(--san-espresso-40)" strokeWidth="2" />

      {/* Coin stack rising out of the box */}
      <ellipse cx="80" cy="70" rx="26" ry="9" fill="url(#empty-coin)" stroke="var(--san-rust-30)" strokeWidth="2" />
      <ellipse cx="80" cy="58" rx="24" ry="8" fill="url(#empty-coin)" stroke="var(--san-rust-30)" strokeWidth="2" />
      <ellipse cx="80" cy="47" rx="22" ry="7.5" fill="url(#empty-coin)" stroke="var(--san-rust-30)" strokeWidth="2" />
      <text x="80" y="51" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--san-rust-30)" fontFamily="ui-sans-serif, system-ui">
        ₦
      </text>

      {/* Sparkle accents */}
      <path d="M126 40 L129 47 L136 50 L129 53 L126 60 L123 53 L116 50 L123 47 Z" fill="var(--san-amber-50)" opacity="0.8" />
      <circle cx="32" cy="52" r="3" fill="var(--san-amber-60)" opacity="0.6" />
    </svg>
  );
}
