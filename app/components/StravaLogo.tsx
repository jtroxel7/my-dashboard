export default function StravaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 24"
      className={className}
      aria-label="Strava"
      fill="#FC4C02"
    >
      <text
        x="0"
        y="18"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="18"
        fontWeight="700"
      >
        Strava
      </text>
    </svg>
  );
}
