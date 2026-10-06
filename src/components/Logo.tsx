export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3d7bff" />
          <stop offset="1" stopColor="#9b4dff" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />
      <path
        d="M12 27V14.5l8 7.5 8-7.5V27"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
