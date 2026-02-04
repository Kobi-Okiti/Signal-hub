import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import type { Review } from "@/types/review";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import ReviewCard from "@/components/ReviewCard";

const ITEMS_PER_PAGE = 20;

export default function CommunityReviewsScreen() {
  const { user, isLoaded } = useUser();
   const router = useRouter();

  const [communityId, setCommunityId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { total: 0, avg: 0 };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;
    return { total, avg: Math.round(avg * 10) / 10 };
  }, [reviews]);

  const fetchReviews = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      if (!user) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

      // 1) Get the community owned by this user
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (communityError || !community) {
        console.error("Community fetch error:", communityError);
        setCommunityId(null);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (!append) {
        setCommunityId(community.id);
      }

      // 2) Fetch reviews for this community with pagination
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          users!inner(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("community_id", community.id)
        .order("created_at", { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

      if (error) {
        console.error("Fetch reviews error:", error);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const enriched = (data ?? []) as Review[];

      if (append) {
        setReviews((prev) => [...prev, ...enriched]);
      } else {
        setReviews(enriched);
      }

      setHasMore(enriched.length === ITEMS_PER_PAGE);
      setLoading(false);
      setLoadingMore(false);
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoaded || !user) return;
      setPage(0);
      fetchReviews(0, false);
    }, [isLoaded, user, fetchReviews])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchReviews(0, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReviews(nextPage, true);
    }
  };

  const renderStars = (rating: number, size: number = 20) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={size}
          color={i <= rating ? colors.warning : colors.border}
        />
      );
    }
    return stars;
  };

  if (loading && !refreshing) {
    return (
      <View style={[commonStyles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!communityId) {
    return (
      <View style={commonStyles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={commonStyles.heading}>Reviews</Text>
        </View>

        {/* Empty State */}
        <View style={styles.content}>
          <View style={[commonStyles.card, styles.emptyCard]}>
            <Ionicons
              name="business-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Community Found</Text>
            <Text style={styles.emptySubtitle}>
              You don&apos;t have a community associated with this account.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const ListHeaderComponent = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Average Rating */}
        <View style={[commonStyles.card, styles.statCard]}>
          <Text style={styles.statLabel}>Average Rating</Text>
          {stats.total === 0 ? (
            <Text style={styles.statValueNA}>N/A</Text>
          ) : (
            <>
              <Text style={styles.statValue}>{stats.avg}</Text>
              <View style={styles.starsRow}>
                {renderStars(Math.round(stats.avg))}
              </View>
            </>
          )}
        </View>

        {/* Total Reviews */}
        <View style={[commonStyles.card, styles.statCard]}>
          <Text style={styles.statLabel}>Total Reviews</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats.total}
          </Text>
        </View>
      </View>

      {/* Section Title */}
      {reviews.length > 0 && (
        <Text style={styles.sectionTitle}>All Reviews ({reviews.length})</Text>
      )}
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={[commonStyles.card, styles.emptyCard]}>
      <Ionicons
        name="chatbox-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No Reviews Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your community hasn&apos;t received any reviews yet.
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
    <View style={commonStyles.container}>
      {/* Header */}
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
                Reviews
              </Text>
            </View>

      {/* Reviews List */}
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => <ReviewCard review={item} />}
      />
    </View>
  );
}

const styles = {
  centered: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  statsContainer: {
    flexDirection: "row" as const,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center" as const,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: fontSize.xxl + 4,
    fontWeight: "800" as const,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  statValueNA: {
    fontSize: fontSize.xxl,
    fontWeight: "700" as const,
    color: colors.textSecondary,
  },
  starsRow: {
    flexDirection: "row" as const,
    gap: 2,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  emptyCard: {
    alignItems: "center" as const,
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600" as const,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: "center" as const,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center" as const,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
};