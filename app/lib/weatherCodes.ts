const weatherCodes: Record<number, { label: string }> = {
  0: { label: "Clear sky" },
  1: { label: "Mainly clear" },
  2: { label: "Partly cloudy" },
  3: { label: "Overcast" },
  45: { label: "Fog" },
  48: { label: "Depositing rime fog" },
  51: { label: "Light drizzle" },
  53: { label: "Moderate drizzle" },
  55: { label: "Dense drizzle" },
  56: { label: "Light freezing drizzle" },
  57: { label: "Dense freezing drizzle" },
  61: { label: "Slight rain" },
  63: { label: "Moderate rain" },
  65: { label: "Heavy rain" },
  66: { label: "Light freezing rain" },
  67: { label: "Heavy freezing rain" },
  71: { label: "Slight snow" },
  73: { label: "Moderate snow" },
  75: { label: "Heavy snow" },
  77: { label: "Snow grains" },
  80: { label: "Slight showers" },
  81: { label: "Moderate showers" },
  82: { label: "Violent showers" },
  85: { label: "Slight snow showers" },
  86: { label: "Heavy snow showers" },
  95: { label: "Thunderstorm" },
  96: { label: "Thunderstorm with slight hail" },
  99: { label: "Thunderstorm with heavy hail" },
};

export function getWeatherInfo(code: number) {
  return weatherCodes[code] ?? { label: "Unknown" };
}
