import { View, Text, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "../../lib/supabase";
import { CommunityStatsType, CommunityType } from "@/types/community";
import { Market } from "@/types/market";

export default function CommunityDashboard() {
  const { user, isLoaded } = useUser();

  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [followers, setFollowers] = useState<number>(0);
  const [subscribers, setSubscribers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stats, setStats] = useState<CommunityStatsType | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchCommunity = async () => {
      // 1️⃣ Get community owned by user
      const { data, error } = await supabase
        .from("communities")
        .select("id, name, description, subscription_price")
        .eq("owner_id", user.id)
        .single();

      if (error) {
        console.error("Community fetch error:", error);
        setLoading(false);
        return;
      }

      setCommunity(data);

      // 2️⃣ Count followers
      const { count, error: followError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("community_id", data.id);

      if (followError) {
        console.error("Followers count error:", followError);
      } else {
        setFollowers(count ?? 0);
      }

      // 2️⃣ Count subscribers
      const { count: subscriberCount, error: subscriberError } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true })
        .eq("community_id", data.id);

      if (subscriberError) {
        console.error("Subscribers count error:", subscriberError);
      } else {
        setSubscribers(subscriberCount ?? 0);
      }

      // 3️⃣ Fetch markets
      const { data: marketData, error: marketError } = await supabase
        .from("community_markets")
        .select("market")
        .eq("community_id", data.id);

      if (marketError) {
        console.error("Markets fetch error:", marketError);
      } else {
        setMarkets(marketData.map((m) => m.market));
      }

      // 4️⃣ Fetch community stats
      const { data: statsData, error: statsError } = await supabase
        .from("community_stats")
        .select("*")
        .eq("community_id", data.id)
        .single();

      if (statsError) {
        // Fallback for edge case - DB should create initial stats row with zeros
        if (statsError.code === "PGRST116") {
          setStats({
            community_id: data.id,
            total_signals: 0,
            wins: 0,
            losses: 0,
            win_rate: 0,
          });
        } else {
          console.error("Community stats fetch error:", statsError);
        }
      } else {
        setStats(statsData);
      }

      setLoading(false);
    };

    fetchCommunity();
  }, [isLoaded, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No community found.</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>{community.name}</Text>

      {community.description && (
        <Text style={{ marginTop: 8 }}>{community.description}</Text>
      )}

      <Text style={{ marginTop: 12 }}>
        Subscription price: ₦{community.subscription_price ?? 0}
      </Text>

      <Text style={{ marginTop: 12 }}>Followers: {followers}</Text>
      <Text style={{ marginTop: 12 }}>Subscribers: {subscribers}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
        {markets.map((market) => (
          <View
            key={market}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: "#eee",
              marginRight: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 12 }}>{market.toUpperCase()}</Text>
          </View>
        ))}
      </View>
      {stats && (
        <View style={{ marginTop: 16 }}>
          <Text>Total signals: {stats.total_signals}</Text>
          <Text>Wins: {stats.wins}</Text>
          <Text>Losses: {stats.losses}</Text>
          <Text>Win rate: {stats.win_rate}%</Text>
        </View>
      )}
    </View>
  );
}
