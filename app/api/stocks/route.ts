import { NextRequest, NextResponse } from "next/server";
import type { StocksData } from "@/app/lib/types/stocks";

// Mock data for stocks - replace with real API calls when you have an API key
// For real data: Get free API key from https://www.alphavantage.co/support/#api-key
// Then uncomment the real API code below
const MOCK_QUOTES = {
  VOO: {
    symbol: "VOO",
    price: 487.32,
    change: 2.15,
    changePercent: 0.44,
  },
  VT: {
    symbol: "VT",
    price: 118.54,
    change: 1.08,
    changePercent: 0.92,
  },
  QQQ: {
    symbol: "QQQ",
    price: 423.91,
    change: 3.22,
    changePercent: 0.77,
  },
  VTTSX: {
    symbol: "VTTSX",
    price: 47.28,
    change: 0.31,
    changePercent: 0.66,
  },
};

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    // If API key is not set, fall back to mock data
    if (!apiKey) {
      const quotes = Object.values(MOCK_QUOTES);
      const data: StocksData = { quotes };
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    const symbols = ["VOO", "VT", "QQQ", "VTTSX"];

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
          const res = await fetch(url, { next: { revalidate: 300 } });
          const data = (await res.json()) as any;

          // Log the response for debugging
          console.log(`[Stocks API] ${symbol} response:`, data);

          const quote = data["Global Quote"];

          if (!quote || !quote["05. price"]) {
            console.log(`[Stocks API] No price data for ${symbol}`);
            return { symbol, price: 0, change: 0, changePercent: 0 };
          }

          const result = {
            symbol,
            price: parseFloat(quote["05. price"]) || 0,
            change: parseFloat(quote["09. change"]) || 0,
            changePercent: parseFloat(quote["10. change percent"]?.replace("%", "") || "0"),
          };
          console.log(`[Stocks API] ${symbol} parsed:`, result);
          return result;
        } catch (error) {
          console.error(`[Stocks API] Error fetching ${symbol}:`, error);
          return { symbol, price: 0, change: 0, changePercent: 0 };
        }
      })
    );

    console.log("[Stocks API] All quotes before filter:", quotes);
    const filteredQuotes = quotes.filter((q) => q.price > 0);
    console.log("[Stocks API] Filtered quotes:", filteredQuotes);

    // If no valid quotes from API, log and return fallback
    if (filteredQuotes.length === 0) {
      console.warn(
        "[Stocks API] No valid quotes returned. Alpha Vantage may be rate-limited. Returning mock data."
      );
      // Fall back to mock data if API returns nothing
      const mockData: StocksData = {
        quotes: Object.values(MOCK_QUOTES),
      };
      return NextResponse.json(mockData, {
        headers: {
          "Cache-Control": "public, s-maxage=60", // Short cache for mock data
          "X-Data-Source": "mock",
        },
      });
    }

    const data: StocksData = {
      quotes: filteredQuotes,
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Data-Source": "live",
      },
    });
  } catch (error) {
    console.error("Stocks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock quotes" },
      { status: 500 }
    );
  }
}
