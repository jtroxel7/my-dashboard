"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import WeatherIcon from "./WeatherIcon";
import type { WeatherData } from "@/app/lib/types/weather";
import { getWeatherInfo } from "@/app/lib/weatherCodes";

type Status = "loading" | "denied" | "error" | "ok";

export default function WeatherCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (!res.ok) throw new Error("API request failed");
          const data: WeatherData = await res.json();
          setWeather(data);
          setStatus("ok");
        } catch {
          setStatus("error");
          setErrorMsg("Could not load weather data.");
        }
      },
      () => {
        setStatus("denied");
      }
    );
  }, []);

  if (status === "loading") {
    return (
      <DashboardCard title="Weather" icon={<WeatherIcon />} className="md:col-span-2">
        <p className="text-sm text-foreground/70 animate-pulse">
          Detecting location...
        </p>
      </DashboardCard>
    );
  }

  if (status === "denied") {
    return (
      <DashboardCard title="Weather" icon={<WeatherIcon />} className="md:col-span-2">
        <p className="text-sm text-foreground/70">
          Location permission denied. Enable location access to see your
          forecast.
        </p>
      </DashboardCard>
    );
  }

  if (status === "error" || !weather) {
    return (
      <DashboardCard title="Weather" icon={<WeatherIcon />} className="md:col-span-2">
        <p className="text-sm text-red-400">{errorMsg}</p>
      </DashboardCard>
    );
  }

  const current = getWeatherInfo(weather.current.weatherCode);

  // Filter hourly data to show next 12 hours from current time
  const now = new Date();
  const currentHourIndex = weather.hourly.findIndex(
    (h) => new Date(h.time) >= now
  );
  const next12Hours = weather.hourly.slice(
    currentHourIndex,
    currentHourIndex + 12
  );

  return (
    <DashboardCard title="Weather" icon={<WeatherIcon />} className="md:col-span-2">
      {/* Location */}
      <p className="mb-3 text-sm font-medium text-foreground/70">
        {weather.location}
      </p>

      {/* Current conditions */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-2xl font-semibold text-foreground/80">{current.label}</span>
        <div>
          <p className="text-3xl font-bold">{weather.current.temperature}&deg;F</p>
        </div>
        <div className="ml-auto text-right text-sm text-foreground/60">
          <p>Feels like {weather.current.feelsLike}&deg;</p>
          <p>Humidity {weather.current.humidity}%</p>
          <p>Wind {weather.current.windSpeed} mph</p>
        </div>
      </div>

      {/* Hourly forecast */}
      <div className="mb-4 -mx-1 overflow-x-auto">
        <div className="flex gap-3 px-1 pb-2">
          {next12Hours.map((h) => {
            const info = getWeatherInfo(h.weatherCode);
            const hour = new Date(h.time).toLocaleTimeString([], {
              hour: "numeric",
            });
            return (
              <div
                key={h.time}
                className="flex shrink-0 flex-col items-center gap-1 text-xs"
              >
                <span className="text-foreground/50">{hour}</span>
                <span className="text-foreground/70">{info.label}</span>
                <span className="font-medium">{h.temperature}&deg;</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="space-y-1">
        {weather.daily.map((d) => {
          const info = getWeatherInfo(d.weatherCode);
          const day = new Date(d.date + "T00:00").toLocaleDateString([], {
            weekday: "short",
          });
          return (
            <div
              key={d.date}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-10 text-foreground/60">{day}</span>
              <span className="text-foreground/70 min-w-[4rem]">{info.label}</span>
              <span className="ml-auto tabular-nums">
                {d.tempMin}&deg; / {d.tempMax}&deg;
              </span>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
