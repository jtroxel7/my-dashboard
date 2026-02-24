export default function StravaLogo({ className }: { className?: string }) {
  return (
    <img
      src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg"
      className={className}
      aria-label="Strava"
      alt="Strava"
      loading="lazy"
      decoding="async"
    />
  );
}
