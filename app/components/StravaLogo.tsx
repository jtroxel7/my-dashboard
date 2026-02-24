export default function StravaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-label="Strava"
      fill="none"
      role="img"
    >
      <path d="M12 3L17.5 13H14L12 9.4L10 13H6.5L12 3Z" fill="#FC4C02" />
      <path d="M12 12L15.5 18.5H12.8L12 17L11.2 18.5H8.5L12 12Z" fill="#FC4C02" />
    </svg>
  );
}
