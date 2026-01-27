export type SignalStatus = "pending" | "win" | "loss";
export type SignalType = "free" | "vip";
export type MarketType = "crypto" | "forex" | "stocks";

export interface Signal {
  id: string;
  community_id: string
  asset: string;
  type: SignalType;
  market: MarketType;
  direction: "buy" | "sell";
  entry_price: number;
  take_profit?: number | null;
  stop_loss?: number | null;
  status: SignalStatus;
  created_at: string;
}
