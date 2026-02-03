import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import CommunityCard from "@/components/CommunityCard";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { CommunityType } from "@/types/community";
import { MarketType } from "@/types/signal";

type CommunityWithStats = CommunityType & {
  markets: {
    market: MarketType;
  }[];
  community_stats: {
    total_signals: number;
    win_rate: number;
  } | null;
};

const ITEMS_PER_PAGE = 20;

export default function FollowedCommunitiesScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [communities, setCommunities] = useState<CommunityWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchFollowedCommunities = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      if (!user?.id) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

      // Get ALL followed community IDs (no pagination here)
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("community_id")
        .eq("user_id", user.id);

      if (followsError) {
        console.error("Follows fetch error:", followsError);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (!follows || follows.length === 0) {
        setCommunities([]);
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
        return;
      }

      const communityIds = follows.map((f) => f.community_id);

      // Fetch communities + markets WITH pagination
      const { data: communitiesData, error: communitiesError } = await supabase
        .from("communities")
        .select(
          `
          *,
          markets:community_markets (
            market
          )
        `
        )
        .in("id", communityIds)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (communitiesError) {
        console.error("Communities fetch error:", communitiesError);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (!communitiesData || communitiesData.length === 0) {
        if (!append) setCommunities([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      // Get community IDs from this page
      const pageCommunityIds = communitiesData.map((c) => c.id);

      // Fetch stats for this page's communities
      const { data: statsData } = await supabase
        .from("community_stats")
        .select("community_id, total_signals, win_rate")
        .in("community_id", pageCommunityIds);

      // Map stats
      const statsMap = new Map(
        statsData?.map((stat) => [stat.community_id, stat]) ?? []
      );

      // Enrich communities
      const enriched: CommunityWithStats[] = communitiesData.map((community) => ({
        ...community,
        community_stats: statsMap.get(community.id) || null,
      }));

      if (append) {
        setCommunities((prev) => [...prev, ...enriched]);
      } else {
        setCommunities(enriched);
      }

      setHasMore(enriched.length === ITEMS_PER_PAGE);
      setLoading(false);
      setLoadingMore(false);
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      setPage(0);
      fetchFollowedCommunities(0, false);
    }, [fetchFollowedCommunities])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchFollowedCommunities(0, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFollowedCommunities(nextPage, true);
    }
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

  const ListEmptyComponent = () => (
    <View
      style={[
        commonStyles.card,
        {
          alignItems: "center",
          paddingVertical: spacing.xxl * 2,
        },
      ]}
    >
      <Ionicons name="heart-outline" size={64} color={colors.textSecondary} />
      <Text
        style={{
          fontSize: fontSize.lg,
          fontWeight: "600",
          color: colors.text,
          marginTop: spacing.lg,
          textAlign: "center",
        }}
      >
        No Followed Communities
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginTop: spacing.sm,
          textAlign: "center",
        }}
      >
        Follow communities to see them here
      </Text>
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed Header with Back Button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: spacing.md,
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: fontSize.xl,
            fontWeight: "800",
            color: colors.text,
            flex: 1,
          }}
        >
          Followed Communities
        </Text>
      </View>

      {/* Communities List */}
      <FlatList
        data={communities}
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
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        ListHeaderComponent={
          communities.length > 0 ? (
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.textSecondary,
                marginBottom: spacing.md,
              }}
            >
              {communities.length} communit
              {communities.length === 1 ? "y" : "ies"} followed
            </Text>
          ) : null
        }
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <CommunityCard
            community={item}
            onPress={() => router.push(`/community-profile/${item.id}`)}
          />
        )}
      />
    </View>
  );
}