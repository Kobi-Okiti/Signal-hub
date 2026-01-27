import { MarketType } from "./signal";

export const MARKETS = ["crypto", "forex", "stocks"] as const;
export type Market = (typeof MARKETS)[number];

export type MarketDataType = {
  id: string;
  community_id: string;
  market: MarketType;
};

export const MARKET_ASSETS: Record<MarketType, string[]> = {
  forex: ["EUR/USD", "GBP/JPY", "USD/JPY"],
  crypto: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
  stocks: ["AAPL", "TSLA", "MSFT"],
};