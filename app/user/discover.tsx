import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { CommunityType } from "@/types/community";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { useDebounce } from "../../hooks/useDebounce";
import CommunityCard from "@/components/CommunityCard";
import { Ionicons } from "@expo/vector-icons";
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

const MARKET_FILTERS: MarketType[] = ["crypto", "forex", "stocks"];
const ITEMS_PER_PAGE = 20;

export default function DiscoverScreen() {
  const router = useRouter();

  const [communities, setCommunities] = useState<CommunityWithStats[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchCommunities = useCallback(
  async (pageNum: number = 0, append: boolean = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    // 1️⃣ Fetch communities with markets
    const { data: communitiesData, error } = await supabase
      .from("communities")
      .select(
        `
        *,
        markets:community_markets (
          market
        )
      `
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

    if (error) {
      console.error("Discover fetch error:", error);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (!communitiesData || communitiesData.length === 0) {
      if (append) {
        // No more data
      } else {
        setCommunities([]);
      }
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    // 2️⃣ Get all community IDs
    const communityIds = communitiesData.map((c) => c.id);

    // 3️⃣ Fetch stats for these communities
    const { data: statsData } = await supabase
      .from("community_stats")
      .select("community_id, total_signals, win_rate")
      .in("community_id", communityIds);

    // 4️⃣ Create a map for quick lookup
    const statsMap = new Map(
      statsData?.map((stat) => [stat.community_id, stat]) ?? []
    );

    // 5️⃣ Enrich communities with their stats
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
  []
);

  useEffect(() => {
    setPage(0);
    fetchCommunities(0, false);
  }, [fetchCommunities]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchCommunities(0, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCommunities(nextPage, true);
    }
  };

  const filteredCommunities = communities
    .filter((community) => {
      if (selectedMarket === "all") return true;
      return community.markets?.some((m) => m.market === selectedMarket);
    })
    .filter((community) => {
      if (!debouncedSearchQuery.trim()) return true;

      const query = debouncedSearchQuery.toLowerCase();

      return (
        community.name.toLowerCase().includes(query) ||
        community.description?.toLowerCase().includes(query)
      );
    });

  const FilterButton = ({ market }: { market: MarketType | "all" }) => {
    const isActive = selectedMarket === market;
    return (
      <TouchableOpacity
        onPress={() => setSelectedMarket(market)}
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.full,
          marginRight: spacing.sm,
          borderWidth: 2,
          borderColor: isActive ? colors.primary : colors.border,
          backgroundColor: isActive ? colors.primary : colors.surface,
        }}
      >
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: isActive ? colors.surface : colors.text,
          }}
        >
          {market.toUpperCase()}
        </Text>
      </TouchableOpacity>
    );
  };

  const ListEmptyComponent = () => {
    if (loading) return null;

    // No communities at all
    if (communities.length === 0 && !searchQuery && selectedMarket === "all") {
      return (
        <View
          style={[
            commonStyles.card,
            { alignItems: "center", paddingVertical: spacing.xxl * 2 },
          ]}
        >
          <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: "600",
              color: colors.text,
              marginTop: spacing.lg,
              textAlign: "center",
            }}
          >
            No Communities Yet
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              color: colors.textSecondary,
              marginTop: spacing.sm,
              textAlign: "center",
            }}
          >
            Check again later for new communities
          </Text>
        </View>
      );
    }

    // Filtered/searched but no results
    return (
      <View
        style={[
          commonStyles.card,
          { alignItems: "center", paddingVertical: spacing.xxl * 2 },
        ]}
      >
        <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: "600",
            color: colors.text,
            marginTop: spacing.lg,
            textAlign: "center",
          }}
        >
          No Communities Found
        </Text>
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.textSecondary,
            marginTop: spacing.sm,
            textAlign: "center",
          }}
        >
          Try adjusting your search or filters
        </Text>
      </View>
    );
  };

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
    {/* Fixed Header - Outside FlatList */}
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
      {/* Title */}
      <Text
        style={{
          fontSize: fontSize.xxl,
          fontWeight: "800",
          color: colors.text,
          marginBottom: spacing.lg,
        }}
      >
        Discover
      </Text>

      {/* Search Bar */}
      <View style={{ marginBottom: spacing.lg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search communities..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.sm,
              fontSize: fontSize.md,
              color: colors.text,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: spacing.lg }}
      >
        <FilterButton market="all" />
        {MARKET_FILTERS.map((market) => (
          <FilterButton key={market} market={market} />
        ))}
      </ScrollView>
    </View>

    {/* FlatList with only results count and communities */}
    <FlatList
      data={filteredCommunities}
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
        paddingBottom: spacing.xxl,
      }}
      ListHeaderComponent={
        filteredCommunities.length > 0 ? (
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.md,
            }}
          >
            {filteredCommunities.length} communit
            {filteredCommunities.length === 1 ? "y" : "ies"} found
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