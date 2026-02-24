import DashboardCard from "./components/DashboardCard";

export default function Home() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-foreground/50">
          Here&apos;s what&apos;s happening today.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <DashboardCard title="Whoop" icon="💚">
          <p className="text-sm text-foreground/70">
            Connect Whoop to see your recovery and strain data.
          </p>
        </DashboardCard>

        <DashboardCard title="Weather" icon="☀️">
          <p className="text-sm text-foreground/70">
            Add a weather integration to see your local forecast.
          </p>
        </DashboardCard>

        <DashboardCard title="Running" icon="🏃">
          <p className="text-sm text-foreground/70">
            Connect Strava or Garmin to see your running stats.
          </p>
        </DashboardCard>

        <DashboardCard title="Stocks" icon="📈">
          <p className="text-sm text-foreground/70">
            Add tickers to track your stock portfolio.
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}
