export const MARKETS = ["crypto", "forex", "stocks"] as const;
export type Market = (typeof MARKETS)[number];

export type MarketType = {
  community_id: string;
  market: Market;
};
