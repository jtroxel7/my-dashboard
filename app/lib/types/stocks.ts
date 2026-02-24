export interface StockQuote {
  symbol: string;
  price: number;
  change: number;       // dollar change
  changePercent: number;   // one-day %
  changePercent1Week?: number;  // one-week %
}

export interface StocksData {
  quotes: StockQuote[];
}
