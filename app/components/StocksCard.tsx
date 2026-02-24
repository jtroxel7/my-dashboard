"use client";

import { useEffect, useState } from "react";
import DashboardCard from "./DashboardCard";
import type { StocksData } from "@/app/lib/types/stocks";

type Status = "loading" | "error" | "ok";

export default function StocksCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<StocksData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/stocks");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        const stocksData: StocksData = await res.json();
        const dataSource = res.headers.get("X-Data-Source");
        console.log("[StocksCard] Data received:", stocksData, "Source:", dataSource);
        setData(stocksData);
        setIsMockData(dataSource === "mock");
        setStatus("ok");
      } catch (error) {
        setStatus("error");
        const message = error instanceof Error ? error.message : "Failed to load stock data";
        console.error("[StocksCard] Error:", message);
        setErrorMsg(message);
      }
    };

    fetchData();
  }, []);

  if (status === "loading") {
    return (
      <DashboardCard title="Stocks">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-foreground/10 rounded w-3/4"></div>
          <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
        </div>
      </DashboardCard>
    );
  }

  if (status === "error") {
    return (
      <DashboardCard title="Stocks">
        <p className="text-sm text-red-400">{errorMsg}</p>
        <p className="text-xs text-foreground/50 mt-2">
          Check your internet connection or try again later.
        </p>
      </DashboardCard>
    );
  }

  if (!data || data.quotes.length === 0) {
    return (
      <DashboardCard title="Stocks">
        <p className="text-sm text-red-400">No stock data available</p>
        <p className="text-xs text-foreground/50 mt-2">
          Check the browser console (F12) for error details. The API may be rate-limited.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Stocks">
      {isMockData && (
        <p className="text-xs text-yellow-500 mb-3">
          Showing sample data (API may be rate-limited)
        </p>
      )}
      <div className="space-y-2">
        {data.quotes.map((quote) => {
          const isPositive1d = quote.changePercent >= 0;
          const isPositive1w = (quote.changePercent1Week ?? 0) >= 0;
          return (
            <div
              key={quote.symbol}
              className="flex items-center justify-between bg-foreground/5 rounded-lg p-3"
            >
              <p className="font-semibold text-sm">{quote.symbol}</p>
              <div className="flex gap-4 text-right">
                <span
                  className={`text-sm font-medium ${isPositive1d ? "text-green-400" : "text-red-400"}`}
                  title="1 day"
                >
                  {isPositive1d ? "+" : ""}
                  {quote.changePercent.toFixed(2)}% 1d
                </span>
                <span
                  className={`text-sm font-medium ${isPositive1w ? "text-green-400" : "text-red-400"}`}
                  title="1 week"
                >
                  {quote.changePercent1Week != null ? (
                    <>
                      {isPositive1w ? "+" : ""}
                      {quote.changePercent1Week.toFixed(2)}% 1w
                    </>
                  ) : (
                    <span className="text-foreground/50">— 1w</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
