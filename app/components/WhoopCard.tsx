"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import WhoopLogo from "./WhoopLogo";
import type { WhoopData } from "@/app/lib/types/whoop";

type Status = "loading" | "error" | "ok";

export default function WhoopCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<WhoopData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/whoop");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const msg =
            errorData.hint ||
            errorData.error ||
            "Failed to fetch Whoop data";
          const statusCode = errorData.statusCode ?? res.status;
          throw new Error(
            statusCode ? `${msg} (${statusCode})` : msg
          );
        }
        const whoopData: WhoopData = await res.json();
        setData(whoopData);
        setStatus("ok");
      } catch (error) {
        setStatus("error");
        setErrorMsg(
          error instanceof Error ? error.message : "Failed to load Whoop data"
        );
      }
    };

    fetchData();
  }, []);

  if (status === "loading") {
    return (
      <DashboardCard title="" icon={<WhoopLogo />}>
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-foreground/10 rounded w-3/4"></div>
          <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
        </div>
      </DashboardCard>
    );
  }

  if (status === "error") {
    const isLocal = typeof window !== "undefined" && window.location?.hostname === "localhost";
    const is401 = errorMsg.includes("401");
    return (
      <DashboardCard title="" icon={<WhoopLogo />}>
        <p className="text-sm text-red-400">{errorMsg}</p>
        <p className="text-xs text-foreground/50 mt-2">
          {isLocal ? (
            is401 ? (
              <>
                Add <code className="bg-foreground/10 px-1 rounded">WHOOP_REFRESH_TOKEN</code>,{" "}
                <code className="bg-foreground/10 px-1 rounded">WHOOP_CLIENT_ID</code>, and{" "}
                <code className="bg-foreground/10 px-1 rounded">WHOOP_CLIENT_SECRET</code> to .env.local and restart, or get a new token from <a href="/whoop-auth" className="underline">/whoop-auth</a>.
              </>
            ) : (
              <>
                Add <code className="bg-foreground/10 px-1 rounded">WHOOP_ACCESS_TOKEN</code> to .env.local (get a token from <a href="/whoop-auth" className="underline">/whoop-auth</a>), then restart the dev server.
              </>
            )
          ) : (
            "Ensure WHOOP_ACCESS_TOKEN (and optionally WHOOP_REFRESH_TOKEN) are set in your hosting environment variables."
          )}
        </p>
      </DashboardCard>
    );
  }

  if (!data) {
    return (
      <DashboardCard title="" icon={<WhoopLogo />}>
        <p className="text-sm text-foreground/70">No data available</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="" icon={<WhoopLogo />}>
      <div className="grid grid-cols-3 gap-3">
        {/* Row 1: Recovery (colored), Sleep, Strain */}
        <div
          className={`rounded-lg p-3 ${
            data.recovery <= 33
              ? "bg-red-500/20 text-red-400"
              : data.recovery <= 66
                ? "bg-orange-500/20 text-orange-400"
                : "bg-green-500/20 text-green-400"
          }`}
        >
          <p className="text-xs opacity-80 mb-1">Recovery</p>
          <p className="text-lg font-bold">{Math.round(data.recovery)}%</p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Sleep</p>
          <p className="text-lg font-bold">{Math.round(data.sleep)}%</p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Strain</p>
          <p className="text-lg font-bold">{data.strain.toFixed(1)}</p>
        </div>
        {/* Row 2: HRV, Resting HR, Steps */}
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">HRV</p>
          <p className="text-lg font-bold">{Math.round(data.hrv)}ms</p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Resting HR</p>
          <p className="text-lg font-bold">
            {data.restingHeartRate ? `${data.restingHeartRate} bpm` : "—"}
          </p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Steps</p>
          <p className="text-lg font-bold">{data.steps.toLocaleString()}</p>
        </div>
      </div>
    </DashboardCard>
  );
}
