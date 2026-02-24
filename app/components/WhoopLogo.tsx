export default function WhoopLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 24"
      className={className}
      aria-label="Whoop"
      fill="currentColor"
      style={{ color: "#00E676" }}
    >
      <text
        x="0"
        y="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="18"
        fontWeight="700"
        letterSpacing="0.05em"
      >
        WHOOP
      </text>
    </svg>
  );
}
