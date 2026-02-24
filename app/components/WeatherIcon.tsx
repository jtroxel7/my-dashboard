export default function WeatherIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-label="Weather"
      fill="none"
      role="img"
    >
      <circle cx="9" cy="9" r="3.5" fill="#F59E0B" />
      <path
        d="M7 17.5H16.2C17.75 17.5 19 16.25 19 14.7C19 13.15 17.75 11.9 16.2 11.9C16.03 11.9 15.86 11.91 15.7 11.94C15.25 10.2 13.67 8.9 11.8 8.9C9.58 8.9 7.77 10.62 7.63 12.8C7.42 12.74 7.21 12.71 7 12.71C5.67 12.71 4.6 13.79 4.6 15.11C4.6 16.43 5.67 17.5 7 17.5Z"
        fill="#94A3B8"
      />
    </svg>
  );
}
