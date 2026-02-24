import WeatherCard from "./components/WeatherCard";
import WhoopCard from "./components/WhoopCard";
import StravaCard from "./components/StravaCard";
import StocksCard from "./components/StocksCard";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <WhoopCard />

        <StravaCard />

        <WeatherCard />

        <StocksCard />

        <ThemeToggle />
      </div>
    </div>
  );
}
