import { CommunityStatsType, CommunityType } from "@/types/community";
import { useUser } from "@clerk/clerk-expo";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../lib/supabase";
import SignalCard from "@/components/SignalCard";
import { useFocusEffect, useRouter } from "expo-router";
import { Signal } from "@/types/signal";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

export default function CommunityDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [stats, setStats] = useState<CommunityStatsType | null>(null);
  const [followers, setFollowers] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const { data: communityData, error: communityError } = await supabase
      .from("communities")
      .select("id, name, owner_id, description, status, subscription_price")
      .eq("owner_id", user.id)
      .single();

    if (communityError || !communityData) {
      console.error("Community fetch error:", communityError);
      setLoading(false);
      return;
    }
    setCommunity(communityData);

    const { count: followerCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityData.id);
    setFollowers(followerCount ?? 0);

    const { count: subscriberCount } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityData.id)
      .eq("status", "active");
    setSubscribers(subscriberCount ?? 0);

    const { data: statsData } = await supabase
      .from("community_stats")
      .select("*")
      .eq("community_id", communityData.id)
      .single();
    setStats(
      statsData ?? {
        community_id: communityData.id,
        total_signals: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
      },
    );

    const { data: signalsData } = await supabase
      .from("signals")
      .select("*")
      .eq("community_id", communityData.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentSignals(signalsData ?? []);

    setLoading(false);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchDashboardData();
  }, [isLoaded, user, fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const handleSignalUpdate = (id: string, status: "win" | "loss") => {
    setRecentSignals((prev) =>
      prev.map((signal) => (signal.id === id ? { ...signal, status } : signal)),
    );

    setStats((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        wins: status === "win" ? prev.wins + 1 : prev.wins,
        losses: status === "loss" ? prev.losses + 1 : prev.losses,
        // total_signals: prev.total_signals + 1,
        win_rate: Math.round(
          ((status === "win" ? prev.wins + 1 : prev.wins) /
            (prev.total_signals)) *
            100,
        ),
      };
    });
  };

  if (loading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!community) {
    return (
      <View
        style={{
          flex: 1,
          padding: spacing.xl,
          backgroundColor: colors.background,
        }}
      >
        <Text style={commonStyles.body}>No community found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
          {/* Header */}
          <Text
            style={{
              fontSize: fontSize.xxl,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            {community.name}
          </Text>

          {/* Status */}
          {community.status === "pending" && (
            <View
              style={{
                backgroundColor: colors.warning + "15",
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                alignSelf: "flex-start",
                marginTop: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: colors.warning,
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                }}
              >
                Pending Approval
              </Text>
            </View>
          )}

          {community.status === "active" && (
            <View
              style={{
                backgroundColor: colors.success + "15",
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.full,
                alignSelf: "flex-start",
                marginTop: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: colors.success,
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                }}
              >
                Active
              </Text>
            </View>
          )}
        </View>

        {/* Community Stats Grid */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <View style={[commonStyles.statCard, { flex: 1 }]}>
              <Text style={commonStyles.statLabel}>Followers</Text>
              <Text style={commonStyles.statValue}>{followers}</Text>
            </View>
            <View style={[commonStyles.statCard, { flex: 1 }]}>
              <Text style={commonStyles.statLabel}>Subscribers</Text>
              <Text style={[commonStyles.statValue, { color: colors.success }]}>
                {subscribers}
              </Text>
            </View>
          </View>

          {/* Performance Card */}
          {stats && (
            <View style={commonStyles.card}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: spacing.md,
                }}
              >
                Performance
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={commonStyles.caption}>Total Signals</Text>
                <Text style={commonStyles.body}>{stats.total_signals}</Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={commonStyles.caption}>Wins</Text>
                <Text style={[commonStyles.body, { color: colors.success }]}>
                  {stats.wins}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={commonStyles.caption}>Losses</Text>
                <Text style={[commonStyles.body, { color: colors.danger }]}>
                  {stats.losses}
                </Text>
              </View>

              <View style={commonStyles.divider} />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Win Rate
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.xl,
                    fontWeight: "700",
                    color:
                      stats.win_rate >= 50 ? colors.success : colors.danger,
                  }}
                >
                  {stats.win_rate}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Recent Signals */}
        <View
          style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <Text style={commonStyles.subheading}>Recent Signals</Text>
            {recentSignals.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/community/my-community/signals")}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: fontSize.sm,
                    fontWeight: "600",
                  }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recentSignals.length === 0 ? (
            <View
              style={[
                commonStyles.card,
                { alignItems: "center", paddingVertical: spacing.xxl },
              ]}
            >
              <Ionicons
                name="analytics-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  commonStyles.caption,
                  { marginTop: spacing.md, textAlign: "center" },
                ]}
              >
                No signals yet. Create your first signal to get started!
              </Text>
            </View>
          ) : (
            recentSignals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onUpdated={(status) => handleSignalUpdate(signal.id, status)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
