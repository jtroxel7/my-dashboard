"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import StravaLogo from "./StravaLogo";
import type { StravaData } from "@/app/lib/types/strava";

type Status = "loading" | "error" | "ok";

export default function StravaCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<StravaData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/strava");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const baseMsg =
            errorData.error || "Failed to fetch Strava data";
          const msg =
            errorData.hint ? `${baseMsg} ${errorData.hint}` : baseMsg;
          throw new Error(msg);
        }
        const stravaData: StravaData = await res.json();
        setData(stravaData);
        setStatus("ok");
      } catch (error) {
        setStatus("error");
        setErrorMsg(
          error instanceof Error ? error.message : "Failed to load Strava data"
        );
      }
    };

    fetchData();
  }, []);

  if (status === "loading") {
    return (
      <DashboardCard title="" icon={<StravaLogo className="scale-90 origin-left" />}>
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-foreground/10 rounded w-3/4"></div>
          <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
        </div>
      </DashboardCard>
    );
  }

  if (status === "error") {
    return (
      <DashboardCard title="" icon={<StravaLogo className="scale-90 origin-left" />}>
        <p className="text-sm text-red-400">{errorMsg}</p>
        <p className="text-xs text-foreground/50 mt-2">
          Ensure STRAVA_ACCESS_TOKEN, STRAVA_REFRESH_TOKEN, STRAVA_CLIENT_ID, and STRAVA_CLIENT_SECRET are configured, or get fresh tokens from <a href="/strava-auth" className="underline">/strava-auth</a>.
        </p>
      </DashboardCard>
    );
  }

  if (!data) {
    return (
      <DashboardCard title="" icon={<StravaLogo className="scale-90 origin-left" />}>
        <p className="text-sm text-foreground/70">No data available</p>
      </DashboardCard>
    );
  }

  // Find max miles for scaling the bar chart
  const maxMiles = Math.max(...data.weeklyMileage.map((w) => w.miles), 1);

  return (
    <DashboardCard title="" icon={<StravaLogo className="scale-90 origin-left" />}>
      <div className="space-y-3">
        {/* Total */}
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">3-Month Total</p>
          <p className="text-2xl font-bold">{data.totalMiles.toFixed(1)} mi</p>
        </div>

        {/* Weekly bars */}
        <div className="space-y-1">
          <p className="text-xs text-foreground/60 mb-2">Weekly Mileage</p>
          {data.weeklyMileage.map((week) => (
            <div key={week.week} className="flex items-center gap-2">
              <span className="text-xs text-foreground/50 w-16">
                {new Date(week.week).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <div className="flex-1 bg-foreground/5 rounded h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${(week.miles / maxMiles) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-foreground/60 w-12 text-right">
                {week.miles.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
