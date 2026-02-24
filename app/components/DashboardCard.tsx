interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({
  title,
  icon,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <div
      className={`card p-5 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="flex shrink-0 [&>svg]:h-5 [&>svg]:w-auto">{icon}</span>}
        {title ? (
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
            {title}
          </h2>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}
