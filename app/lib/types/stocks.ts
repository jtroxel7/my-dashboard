export interface StockQuote {
  symbol: string;
  price: number;
  change: number;       // dollar change
  changePercent: number;
}

export interface StocksData {
  quotes: StockQuote[];
}
