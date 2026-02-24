import { NextRequest, NextResponse } from "next/server";
import type { WeatherData } from "@/app/lib/types/weather";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon query parameters are required" },
      { status: 400 }
    );
  }

  // Fetch location name via reverse geocoding
  const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const geocodeRes = await fetch(geocodeUrl, {
    headers: { "User-Agent": "WeatherDashboard/1.0" },
    next: { revalidate: 86400 }, // cache for 24 hours
  });

  let location = "Unknown Location";
  if (geocodeRes.ok) {
    const geocodeData = await geocodeRes.json();
    location = geocodeData.address?.city ||
               geocodeData.address?.town ||
               geocodeData.address?.village ||
               geocodeData.address?.county ||
               "Unknown Location";
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("hourly", "temperature_2m,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), {
    next: { revalidate: 900 }, // cache for 15 minutes
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 502 }
    );
  }

  const raw = await res.json();

  // Return all hourly data; client will filter based on browser time
  const hourlyData = raw.hourly.time.map((time: string, i: number) => ({
    time,
    temperature: Math.round(raw.hourly.temperature_2m[i]),
    weatherCode: raw.hourly.weather_code[i],
  }));

  const data: WeatherData = {
    location,
    current: {
      temperature: Math.round(raw.current.temperature_2m),
      feelsLike: Math.round(raw.current.apparent_temperature),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: Math.round(raw.current.wind_speed_10m),
      weatherCode: raw.current.weather_code,
    },
    hourly: hourlyData,
    daily: raw.daily.time.map((date: string, i: number) => ({
      date,
      tempMin: Math.round(raw.daily.temperature_2m_min[i]),
      tempMax: Math.round(raw.daily.temperature_2m_max[i]),
      weatherCode: raw.daily.weather_code[i],
    })),
  };

  return NextResponse.json(data);
}
