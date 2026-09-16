// The same mark as the app icon in `public/favicon.svg`, redrawn inline so the
// header glyph and the browser-tab icon stay identical. Geometry changes here
// have to be mirrored there — see `docs/icon.md`.
function BrandMark() {
  return (
    <svg
      viewBox="0 0 512 512"
      className="size-8"
      role="img"
      aria-label="Code Canvas"
    >
      <defs>
        <linearGradient id="brand-mark-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--indigo-400)" />
          <stop offset="1" stopColor="var(--sapphire-500)" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="114" fill="url(#brand-mark-tile)" />

      <g stroke="var(--pearl-100)" strokeWidth="26" strokeLinecap="round">
        <path d="M150 340 L256 172" />
        <path d="M256 172 L362 340" />
      </g>

      <rect
        x="190"
        y="106"
        width="132"
        height="132"
        rx="34"
        fill="var(--gold-400)"
      />
      <rect
        x="84"
        y="274"
        width="132"
        height="132"
        rx="34"
        fill="var(--pearl-100)"
      />
      <rect
        x="296"
        y="274"
        width="132"
        height="132"
        rx="34"
        fill="var(--pearl-100)"
      />
    </svg>
  );
}

export default BrandMark;
