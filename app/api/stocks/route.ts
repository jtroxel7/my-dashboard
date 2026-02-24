import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";
import type { StocksData } from "@/app/lib/types/stocks";

export async function GET(request: NextRequest) {
  try {
    const symbols = ["VOO", "VT", "QQQ", "VTTSX"];

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol) as any;
          return {
            symbol: quote.symbol || symbol,
            price: quote.regularMarketPrice || 0,
            change: (quote.regularMarketChange || 0),
            changePercent: (quote.regularMarketChangePercent || 0) * 100,
          };
        } catch {
          return {
            symbol,
            price: 0,
            change: 0,
            changePercent: 0,
          };
        }
      })
    );

    const data: StocksData = {
      quotes: quotes.filter((q) => q.price > 0),
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
