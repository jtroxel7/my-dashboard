export default function StocksIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-label="Stocks"
      fill="none"
      role="img"
    >
      <path
        d="M5 18.5V6.5M10 18.5V10.5M15 18.5V13.5M20 18.5V8.5"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4.8 12.8L9.4 9.3L13.2 11.3L19.2 5.8"
        stroke="#22C55E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.6 5.8H19.2V8.4"
        stroke="#22C55E"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
