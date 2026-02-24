"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
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
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch Whoop data");
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
      <DashboardCard title="Whoop" icon="💚">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-foreground/10 rounded w-3/4"></div>
          <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
        </div>
      </DashboardCard>
    );
  }

  if (status === "error") {
    return (
      <DashboardCard title="Whoop" icon="💚">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <p className="text-xs text-foreground/50 mt-2">
          Ensure WHOOP_ACCESS_TOKEN is configured in Vercel environment variables.
        </p>
      </DashboardCard>
    );
  }

  if (!data) {
    return (
      <DashboardCard title="Whoop" icon="💚">
        <p className="text-sm text-foreground/70">No data available</p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Whoop" icon="💚">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Recovery</p>
          <p className="text-lg font-bold">{Math.round(data.recovery)}%</p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Sleep</p>
          <p className="text-lg font-bold">{Math.round(data.sleep)}%</p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">HRV</p>
          <p className="text-lg font-bold">{Math.round(data.hrv)}ms</p>
        </div>
        <div className="bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Strain</p>
          <p className="text-lg font-bold">{data.strain.toFixed(1)}</p>
        </div>
        <div className="col-span-2 bg-foreground/5 rounded-lg p-3">
          <p className="text-xs text-foreground/60 mb-1">Steps</p>
          <p className="text-lg font-bold">{data.steps.toLocaleString()}</p>
        </div>
      </div>
    </DashboardCard>
  );
}
