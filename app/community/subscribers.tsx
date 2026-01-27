import { useUser } from "@clerk/clerk-expo";
import { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { CommunityType } from "@/types/community";
import { SubscriberWithUser } from "@/types/subscriber";
import SubscriberCard from "@/components/SubscriberCard";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

export default function SubscribersScreen() {
  const { user, isLoaded } = useUser();

  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [subscribers, setSubscribers] = useState<SubscriberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscribersData = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Fetch community
    const { data: communityData, error: communityError } = await supabase
      .from("communities")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (communityError || !communityData) {
      console.error("Community fetch error:", communityError);
      setLoading(false);
      return;
    }

    setCommunity(communityData);

    // Fetch subscribers and merge with user data
    const { data: subscribersData, error: subsError } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        users!inner(
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("community_id", communityData.id)
      .order("created_at", { ascending: false });

    if (subsError) {
      console.error("Subscribers fetch error:", subsError);
    }

    setSubscribers(subscribersData as SubscriberWithUser[] || []);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoaded || !user) return;
      fetchSubscribersData();
    }, [isLoaded, user, fetchSubscribersData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscribersData();
    setRefreshing(false);
  };

  // Memoized stats calculations
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const activeSubscribers = subscribers.filter((s) => s.status === "active");
    const expiredSubscribers = subscribers.filter((s) => s.status === "expired");
    const totalSubscribers = subscribers.length;

    const activePercent =
      totalSubscribers > 0
        ? Math.round((activeSubscribers.length / totalSubscribers) * 100)
        : 0;

    const monthlyRevenue =
      activeSubscribers.length * (community?.subscription_price ?? 0);

    const subscribersGainedThisMonth = subscribers.filter((s) => {
      const start = new Date(s.start_date);
      return (
        start.getMonth() === currentMonth && start.getFullYear() === currentYear
      );
    }).length;

    const subscribersLostThisMonth = subscribers.filter((s) => {
      const end = new Date(s.end_date);
      return (
        s.status === "expired" &&
        end.getMonth() === currentMonth &&
        end.getFullYear() === currentYear
      );
    }).length;

    return {
      total: totalSubscribers,
      active: activeSubscribers.length,
      expired: expiredSubscribers.length,
      activePercent,
      monthlyRevenue,
      gainedThisMonth: subscribersGainedThisMonth,
      lostThisMonth: subscribersLostThisMonth,
      activeSubscribers,
    };
  }, [subscribers, community]);

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
        {/* Header */}
        <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: fontSize.xxl,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Subscribers
          </Text>
        </View>

        {/* Overview Stats */}
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
              <Text style={commonStyles.statLabel}>Total</Text>
              <Text style={commonStyles.statValue}>{stats.total}</Text>
            </View>
            <View style={[commonStyles.statCard, { flex: 1 }]}>
              <Text style={commonStyles.statLabel}>Active</Text>
              <Text style={[commonStyles.statValue, { color: colors.success }]}>
                {stats.active}
              </Text>
            </View>
            <View style={[commonStyles.statCard, { flex: 1 }]}>
              <Text style={commonStyles.statLabel}>Expired</Text>
              <Text style={[commonStyles.statValue, { color: colors.danger }]}>
                {stats.expired}
              </Text>
            </View>
          </View>

          {/* Revenue Card */}
          <View style={commonStyles.card}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Ionicons
                name="cash-outline"
                size={20}
                color={colors.success}
                style={{ marginRight: spacing.xs }}
              />
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "600",
                  color: colors.text,
                }}
              >
                Monthly Revenue
              </Text>
            </View>
            <Text
              style={{
                fontSize: fontSize.xxl + 4,
                fontWeight: "700",
                color: colors.success,
              }}
            >
              ₦{stats.monthlyRevenue.toLocaleString()}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              {stats.active} active × ₦{community.subscription_price ?? 0}
            </Text>
          </View>
        </View>

        {/* Growth Stats */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.lg }}
        >
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: "600",
              color: colors.text,
              marginBottom: spacing.md,
            }}
          >
            This Month
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={[commonStyles.card, { flex: 1 }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.xs,
                }}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={colors.success}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={commonStyles.caption}>Gained</Text>
              </View>
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: "700",
                  color: colors.success,
                }}
              >
                +{stats.gainedThisMonth}
              </Text>
            </View>
            <View style={[commonStyles.card, { flex: 1 }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.xs,
                }}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={colors.danger}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={commonStyles.caption}>Lost</Text>
              </View>
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: "700",
                  color: colors.danger,
                }}
              >
                -{stats.lostThisMonth}
              </Text>
            </View>
          </View>
        </View>

        {/* Active Retention */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}
        >
          <View style={commonStyles.card}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.sm,
              }}
            >
              Active Rate
            </Text>
            <View
              style={{
                height: 8,
                backgroundColor: colors.border,
                borderRadius: borderRadius.full,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${stats.activePercent}%`,
                  backgroundColor: colors.success,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: "700",
                color: colors.text,
                marginTop: spacing.sm,
              }}
            >
              {stats.activePercent}% Active
            </Text>
          </View>
        </View>

        {/* Subscriber List */}
        <View
          style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
        >
          <Text
            style={[commonStyles.subheading, { marginBottom: spacing.md }]}
          >
            Active Subscribers
          </Text>

          {stats.activeSubscribers.length === 0 ? (
            <View
              style={[
                commonStyles.card,
                { alignItems: "center", paddingVertical: spacing.xxl },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  commonStyles.caption,
                  { marginTop: spacing.md, textAlign: "center" },
                ]}
              >
                No active subscribers yet. Share your community to grow!
              </Text>
            </View>
          ) : (
            stats.activeSubscribers.map((sub) => (
              <SubscriberCard key={sub.id} subscriber={sub} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}