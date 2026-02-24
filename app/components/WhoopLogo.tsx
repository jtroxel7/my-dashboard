export default function WhoopLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-label="Whoop"
      fill="none"
      role="img"
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#00E676" />
      <path
        d="M6.5 8.5L8.5 15.5L11 10.5L13.5 15.5L15.5 8.5L17.5 15.5"
        stroke="#0A1110"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
