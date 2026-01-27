import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { CommunityType } from "@/types/community";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { Signal } from "@/types/signal";
import SignalCard from "@/components/SignalCard";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/constants/styles";
import { MarketDataType } from "@/types/market";

export default function MyCommunityScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);
  const [marketType, setMarketType] = useState<MarketDataType[]>([]);

  // Combined fetch function
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true); // Set loading on every fetch

    const { data: communityData } = await supabase
      .from("communities")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (communityData) {
      setCommunity(communityData);

      // Fetch signals with the community ID we just got
      const { data: signalsData } = await supabase
        .from("signals")
        .select("*")
        .eq("community_id", communityData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentSignals(signalsData ?? []);

      // Fetch signals with the community ID we just got
      const { data: marketsData } = await supabase
        .from("community_markets")
        .select("*")
        .eq("community_id", communityData.id);

      setMarketType(marketsData ?? []);
    }

    setLoading(false);
  }, [user?.id]);

  // Refresh on focus - just like dashboard
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSignalUpdate = (id: string, status: "win" | "loss") => {
    setRecentSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
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
        <Text style={commonStyles.body}>No community found</Text>
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
        {/* Header */}
        <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: fontSize.xxl,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            {community.name}
          </Text>

          {/* Status Badge */}
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
                marginBottom: spacing.sm,
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

          {marketType.length !== 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              {marketType.map((market) => (
                <View
                  key={market.id}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.accent + "15",
                    borderWidth: 1,
                    borderColor: colors.accent + "30",
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      fontWeight: "600",
                      color: colors.accent,
                    }}
                  >
                    {market.market.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
        >
          <View style={commonStyles.card}>
            <View style={{ marginBottom: spacing.md }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: spacing.xs,
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: colors.textSecondary,
                  lineHeight: 22,
                }}
              >
                {community.description || "No description yet"}
              </Text>
            </View>

            <View style={commonStyles.divider} />

            <View style={{ marginTop: spacing.md }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: spacing.xs,
                }}
              >
                Subscription Price
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                ₦{community.subscription_price || 0}
                <Text
                  style={{ fontSize: fontSize.sm, color: colors.textSecondary }}
                >
                  /month
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}
        >
          <TouchableOpacity
            onPress={() => router.push("/community/my-community/new-signals")}
            style={[commonStyles.buttonPrimary, { marginBottom: spacing.md }]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.surface}
              />
              <Text style={commonStyles.buttonText}>Post New Signal</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/community/my-community/signals")}
            style={commonStyles.buttonOutline}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons name="list-outline" size={20} color={colors.primary} />
              <Text style={commonStyles.buttonTextOutline}>
                View All Signals
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Signals */}
        <View
          style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
        >
          <Text style={[commonStyles.subheading, { marginBottom: spacing.md }]}>
            Recent Signals
          </Text>

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
