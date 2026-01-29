import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { Signal } from "@/types/signal";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import LockedSignalCard from "@/components/LockedSignalCard";
import UserSignalCard from "@/components/UserSignalCard";
import { CommunityType } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
// import { MarketType, SignalType } from "@/types/signal";

type FeedSignal = Signal & {
  isSubscribed: boolean;
  community: CommunityType;
};

type FilterType =
  | "all"
  | "free"
  | "vip"
  | "pending"
  | "forex"
  | "crypto"
  | "stocks";

const ITEMS_PER_PAGE = 20;

export default function UserHome() {
  const { user } = useUser();
  const router = useRouter();

  const [signals, setSignals] = useState<FeedSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const fetchFeed = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      if (!user) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

      // Fetch followed + subscribed communities
      const [{ data: follows }, { data: subs }] = await Promise.all([
        supabase.from("follows").select("community_id").eq("user_id", user.id),
        supabase
          .from("subscriptions")
          .select("community_id")
          .eq("user_id", user.id)
          .eq("status", "active"),
      ]);

      const followedIds = follows?.map((f) => f.community_id) ?? [];
      const subscribedIds = subs?.map((s) => s.community_id) ?? [];

      const communityIds = Array.from(
        new Set([...followedIds, ...subscribedIds]),
      );

      if (communityIds.length === 0) {
        setSignals([]);
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
        return;
      }

      // Build query with pagination
      let query = supabase
        .from("signals")
        .select(
          `
          *,
          community:communities (
            id,
            name,
            subscription_price
          )
        `,
          { count: "exact" },
        )
        .in("community_id", communityIds)
        .order("created_at", { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      const { data: signalsData, error } = await query;

      if (error) {
        console.error(error);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Enrich with subscription state
      const enriched: FeedSignal[] =
        signalsData?.map((signal) => ({
          ...signal,
          isSubscribed: subscribedIds.includes(signal.community_id),
        })) ?? [];

      if (append) {
        setSignals((prev) => [...prev, ...enriched]);
      } else {
        setSignals(enriched);
      }

      setHasMore(enriched.length === ITEMS_PER_PAGE);
      setLoading(false);
      setLoadingMore(false);
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => {
      setPage(0);
      fetchFeed(0, false);
    }, [fetchFeed]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchFeed(0, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  };

  // Filter signals based on active filter
  const filteredSignals = signals.filter((signal) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "free") return signal.type === "free";
    if (activeFilter === "vip") return signal.type === "vip";
    if (activeFilter === "pending") return signal.status === "pending";
    // Market filters
    return signal.market === activeFilter;
  });

  const FilterButton = ({
    filter,
    label,
    icon,
  }: {
    filter: FilterType;
    label: string;
    icon?: string;
  }) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        onPress={() => setActiveFilter(filter)}
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          borderWidth: 2,
          borderColor: isActive ? colors.primary : colors.border,
          backgroundColor: isActive ? colors.primary : colors.surface,
          marginRight: spacing.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          {icon && (
            <Ionicons
              name={icon as any}
              size={14}
              color={isActive ? colors.surface : colors.text}
            />
          )}
          <Text
            style={{
              fontSize: fontSize.sm,
              fontWeight: "600",
              color: isActive ? colors.surface : colors.text,
            }}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Title */}
      <Text
        style={{
          fontSize: fontSize.xxl,
          fontWeight: "800",
          color: colors.text,
          marginBottom: spacing.md,
        }}
      >
        Feed
      </Text>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.sm }}
      >
        <FilterButton filter="all" label="All" icon="apps-outline" />
        <FilterButton filter="free" label="Free" icon="gift-outline" />
        <FilterButton filter="vip" label="VIP" icon="star-outline" />
        <FilterButton filter="pending" label="Pending" icon="time-outline" />
        <FilterButton filter="forex" label="Forex" />
        <FilterButton filter="crypto" label="Crypto" />
        <FilterButton filter="stocks" label="Stocks" />
      </ScrollView>

      {/* Count */}
      {filteredSignals.length > 0 && (
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: spacing.sm,
          }}
        >
          {filteredSignals.length} signal
          {filteredSignals.length !== 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );

  const ListEmptyComponent = () => (
    <View
      style={[
        commonStyles.card,
        { alignItems: "center", paddingVertical: spacing.xxl * 2 },
      ]}
    >
      <Ionicons
        name="analytics-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text
        style={{
          fontSize: fontSize.lg,
          fontWeight: "600",
          color: colors.text,
          marginTop: spacing.lg,
          textAlign: "center",
        }}
      >
        No Signals Yet
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginTop: spacing.sm,
          textAlign: "center",
          paddingHorizontal: spacing.xl,
          lineHeight: 22,
        }}
      >
        Follow or subscribe to trading communities to see their signals in your
        feed
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/user/discover")}
        style={[commonStyles.buttonPrimary, { marginTop: spacing.xl }]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Ionicons name="compass-outline" size={20} color={colors.surface} />
          <Text style={commonStyles.buttonText}>Discover Communities</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const ListFooterComponent = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: spacing.lg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={filteredSignals}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => {
          const isLocked = item.type === "vip" && !item.isSubscribed;

          if (isLocked) {
            return (
              <LockedSignalCard
                signal={item}
                onPress={() =>
                  router.push(`/community-profile/${item.community_id}`)
                }
              />
            );
          }

          return (
            <UserSignalCard
              signal={item}
              onPress={() =>
                router.push(`/community-profile/${item.community_id}`)
              }
            />
          );
        }}
      />
    </View>
  );
}
