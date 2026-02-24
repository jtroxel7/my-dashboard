import WeatherCard from "./components/WeatherCard";
import WhoopCard from "./components/WhoopCard";
import StravaCard from "./components/StravaCard";
import StocksCard from "./components/StocksCard";

export default function Home() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <WeatherCard />

        <WhoopCard />

        <StravaCard />

        <StocksCard />
      </div>
    </div>
  );
}
