export default function WhoopLogo({ className }: { className?: string }) {
  const classes = ["whoop-logo-image", className].filter(Boolean).join(" ");

  return (
    <img
      src="https://commons.wikimedia.org/wiki/Special:FilePath/WHOOP%20Logo%20Black.svg"
      className={classes}
      aria-label="Whoop"
      alt="Whoop"
      loading="lazy"
      decoding="async"
    />
  );
}
