export type CommunityType = {
  id: string;
  name: string;
  description: string | null;
  subscription_price: number | null;
};

export type CommunityStatsType = {
  community_id: string;
  total_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
};