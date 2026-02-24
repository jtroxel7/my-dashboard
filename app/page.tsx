import WeatherCard from "./components/WeatherCard";
import WhoopCard from "./components/WhoopCard";
import StravaCard from "./components/StravaCard";
import StocksCard from "./components/StocksCard";

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
        <WeatherCard />

        <WhoopCard />

        <StravaCard />

        <StocksCard />
      </div>
    </div>
  );
}
