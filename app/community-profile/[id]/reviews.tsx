import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import type { Review } from "@/types/review";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import ReviewCard from "@/components/ReviewCard";

const ITEMS_PER_PAGE = 20;

export default function ReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const communityId = useMemo(() => params.id ?? "", [params.id]);

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
      if (!communityId) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

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
        .eq("community_id", communityId)
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
    [communityId]
  );

  useFocusEffect(
    useCallback(() => {
      setPage(0);
      fetchReviews(0, false);
    }, [fetchReviews])
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

  const ListHeaderComponent = () => (
    <View style={{ marginBottom: spacing.lg }}>
      {/* Stats Cards */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        {/* Average Rating */}
        <View style={[commonStyles.card, { flex: 1, alignItems: "center" }]}>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Average Rating
          </Text>
          {stats.total === 0 ? (
            <Text
              style={{
                fontSize: fontSize.xxl,
                fontWeight: "700",
                color: colors.textSecondary,
              }}
            >
              N/A
            </Text>
          ) : (
            <>
              <Text
                style={{
                  fontSize: fontSize.xxl + 4,
                  fontWeight: "800",
                  color: colors.warning,
                  marginBottom: spacing.xs,
                }}
              >
                {stats.avg}
              </Text>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {renderStars(Math.round(stats.avg))}
              </View>
            </>
          )}
        </View>

        {/* Total Reviews */}
        <View style={[commonStyles.card, { flex: 1, alignItems: "center" }]}>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Total Reviews
          </Text>
          <Text
            style={{
              fontSize: fontSize.xxl + 4,
              fontWeight: "800",
              color: colors.primary,
            }}
          >
            {stats.total}
          </Text>
        </View>
      </View>

      {/* Write Review Button */}
      <TouchableOpacity
        onPress={() =>
          router.push(`/community-profile/${communityId}/create-review`)
        }
        style={commonStyles.buttonPrimary}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Ionicons name="create-outline" size={20} color={colors.surface} />
          <Text style={commonStyles.buttonText}>Write a Review</Text>
        </View>
      </TouchableOpacity>

      {/* Section Title */}
      {reviews.length > 0 && (
        <Text
          style={{
            fontSize: fontSize.md,
            fontWeight: "600",
            color: colors.text,
            marginTop: spacing.xl,
            marginBottom: spacing.md,
          }}
        >
          All Reviews ({reviews.length})
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
      <Ionicons name="chatbox-outline" size={64} color={colors.textSecondary} />
      <Text
        style={{
          fontSize: fontSize.lg,
          fontWeight: "600",
          color: colors.text,
          marginTop: spacing.lg,
          textAlign: "center",
        }}
      >
        No Reviews Yet
      </Text>
      <Text
        style={{
          fontSize: fontSize.md,
          color: colors.textSecondary,
          marginTop: spacing.sm,
          textAlign: "center",
        }}
      >
        Be the first to review this community
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
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
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