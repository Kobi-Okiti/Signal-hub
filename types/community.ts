export type CommunityType = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: "active" | "pending";
  subscription_price: number;
};

export type CommunityStatsType = {
  community_id: string;
  total_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
};