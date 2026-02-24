interface DashboardCardProps {
  title: string;
  icon?: string;
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
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
