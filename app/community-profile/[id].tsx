import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { CommunityType } from "@/types/community";
import { Signal } from "@/types/signal";
import { Subscriber, Follower } from "@/types/subscriber";
import UserSignalCard from "@/components/UserSignalCard";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

type Tab = "free" | "vip";

type FeedSignal = Signal & {
  isSubscribed: boolean;
  community: {
    name: string;
  };
};

type CommunityStats = {
  total_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
};

const ITEMS_PER_PAGE = 20;

export default function CommunityProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const router = useRouter();

  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [signals, setSignals] = useState<FeedSignal[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("free");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchData = useCallback(
    async (pageNum: number = 0, append: boolean = false) => {
      if (!id) return;

      if (!append) setLoading(true);
      else setLoadingMore(true);

      const isSubscribed = subscribers.some(
        (s) => s.user_id === user?.id && s.status === "active",
      );

      const [
        { data: communityData },
        { data: statsData },
        { data: signalData },
        { data: followerData },
        { data: subscriberData },
      ] = await Promise.all([
        supabase.from("communities").select("*").eq("id", id).single(),
        supabase
          .from("community_stats")
          .select("total_signals, wins, losses, win_rate")
          .eq("community_id", id)
          .single(),
        supabase
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
          )
          .eq("community_id", id)
          .order("created_at", { ascending: false })
          .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1),
        append
          ? { data: followers }
          : supabase.from("follows").select("*").eq("community_id", id),
        append
          ? { data: subscribers }
          : supabase.from("subscriptions").select("*").eq("community_id", id),
      ]);

      if (!append) {
        setCommunity(communityData);
        setStats(
          statsData ?? {
            total_signals: 0,
            wins: 0,
            losses: 0,
            win_rate: 0,
          },
        );
        setFollowers(followerData ?? []);
        setSubscribers(subscriberData ?? []);
      }

      // Enrich signals with subscription status
      const enriched: FeedSignal[] =
        signalData?.map((signal) => ({
          ...signal,
          isSubscribed,
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
    [id, user?.id, followers, subscribers],
  );

  useEffect(() => {
    setPage(0);
    fetchData(0, false);
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchData(0, false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, true);
    }
  };

  if ( loading && !refreshing || !community || !stats) {
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

  const isFollowing = followers.some((f) => f.user_id === user?.id);
  const isSubscribed = subscribers.some(
    (s) => s.user_id === user?.id && s.status === "active",
  );

  const freeSignals = signals.filter((s) => s.type === "free");
  const vipSignals = signals.filter((s) => s.type === "vip");

  const handleFollow = async () => {
    if (!user) return;

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("user_id", user.id)
        .eq("community_id", community.id);
    } else {
      await supabase.from("follows").insert({
        user_id: user.id,
        community_id: community.id,
      });
    }

    fetchData();
  };

  const handleSubscribe = () => {
    if (!user) return;

    Alert.alert(
      "Subscribe to Premium",
      `Get access to all VIP signals for ₦${community.subscription_price}/month`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: async () => {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            await supabase.from("subscriptions").insert({
              user_id: user.id,
              community_id: community.id,
              status: "active",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
            });

            fetchData();
          },
        },
      ],
    );
  };

  const getWinRateConfig = () => {
    if (stats.win_rate >= 65) {
      return { color: colors.success, icon: "trending-up" as const };
    } else if (stats.win_rate >= 50) {
      return { color: colors.warning, icon: "remove-outline" as const };
    } else {
      return { color: colors.danger, icon: "trending-down" as const };
    }
  };

  const winRateConfig = stats.total_signals > 0 ? getWinRateConfig() : null;

  // const displayedSignals = activeTab === "free" ? freeSignals : vipSignals;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed Header */}
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
          numberOfLines={1}
        >
          {community.name}
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 100;
          if (isCloseToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Community Info Card */}
        <View style={{ padding: spacing.xl }}>
          <View style={[commonStyles.cardWithShadow, { padding: spacing.xl }]}>
            <Text
              style={{
                fontSize: fontSize.xxl,
                fontWeight: "800",
                color: colors.text,
                marginBottom: spacing.sm,
              }}
            >
              {community.name}
            </Text>

            {community.description && (
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: colors.textSecondary,
                  lineHeight: 22,
                  marginBottom: spacing.lg,
                }}
              >
                {community.description}
              </Text>
            )}

            {/* Price Tag */}
            <View
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.full,
                backgroundColor:
                  community.subscription_price === 0
                    ? colors.success + "15"
                    : colors.primary + "15",
                marginBottom: spacing.lg,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "700",
                  color:
                    community.subscription_price === 0
                      ? colors.success
                      : colors.primary,
                }}
              >
                {community.subscription_price === 0
                  ? "Free Community"
                  : `₦${community.subscription_price}/month`}
              </Text>
            </View>


              
              <View style={{ flex: 1, flexDirection:"row", alignItems: "center", justifyContent: "flex-start", marginBottom: spacing.lg, }}>
                <Text
                  style={{
                    fontSize: fontSize.xl,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {stats.total_signals} Signals
                </Text>
              </View>
            

            {/* Stats Grid */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.background,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  Subscribers
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.xl,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {subscribers.length}
                </Text>
              </View>

              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                }}
              />

              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  Win Rate
                </Text>
                {stats.total_signals === 0 ? (
                  <Text
                    style={{
                      fontSize: fontSize.xl,
                      fontWeight: "700",
                      color: colors.textSecondary,
                    }}
                  >
                    N/A
                  </Text>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.xs,
                    }}
                  >
                    <Ionicons
                      name={winRateConfig!.icon}
                      size={18}
                      color={winRateConfig!.color}
                    />
                    <Text
                      style={{
                        fontSize: fontSize.xl,
                        fontWeight: "700",
                        color: winRateConfig!.color,
                      }}
                    >
                      {stats.win_rate.toFixed()}%
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                }}
              />

              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                  }}
                >
                  Followers
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.xl,
                    fontWeight: "700",
                    color: colors.text,
                  }}
                >
                  {followers.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View
          style={{
            paddingHorizontal: spacing.xl,
            marginBottom: spacing.xl,
            gap: spacing.md,
          }}
        >
          {/* Follow Button */}
          <TouchableOpacity
            onPress={handleFollow}
            style={[
              {
                paddingVertical: spacing.lg,
                borderRadius: borderRadius.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
              },
              isFollowing
                ? {
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.secondary,
                  }
                : {
                    backgroundColor: colors.secondary,
                  },
            ]}
          >
            <Ionicons
              name={isFollowing ? "checkmark-circle" : "add-circle-outline"}
              size={22}
              color={isFollowing ? colors.secondary : colors.surface}
            />
            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: "700",
                color: isFollowing ? colors.secondary : colors.surface,
              }}
            >
              {isFollowing ? "Following" : "Follow Community"}
            </Text>
          </TouchableOpacity>

          {/* Subscribe Button or Status */}
          {!isSubscribed ? (
            <TouchableOpacity
              onPress={handleSubscribe}
              style={{
                paddingVertical: spacing.lg,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons name="star" size={22} color={colors.surface} />
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: colors.surface,
                }}
              >
                Subscribe for ₦{community.subscription_price}/mo
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                paddingVertical: spacing.lg,
                borderRadius: borderRadius.md,
                backgroundColor: colors.success + "15",
                borderWidth: 2,
                borderColor: colors.success,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.success}
              />
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: colors.success,
                }}
              >
                Premium Member
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.border,
            gap: spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("free")}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor:
                activeTab === "free" ? colors.accent : colors.background,
              borderWidth: 2,
              borderColor: activeTab === "free" ? colors.accent : colors.border,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "700",
                  color: activeTab === "free" ? colors.surface : colors.text,
                }}
              >
                FREE
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                  color:
                    activeTab === "free"
                      ? colors.surface
                      : colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {freeSignals.length} signals
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("vip")}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor:
                activeTab === "vip" ? colors.warning : colors.background,
              borderWidth: 2,
              borderColor: activeTab === "vip" ? colors.warning : colors.border,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "700",
                  color: activeTab === "vip" ? colors.surface : colors.text,
                }}
              >
                VIP
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                  color:
                    activeTab === "vip" ? colors.surface : colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {vipSignals.length} signals
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Signals Content */}
        <View style={{ padding: spacing.xl }}>
          {activeTab === "free" && (
            <>
              {freeSignals.length === 0 ? (
                <View
                  style={[
                    commonStyles.card,
                    { alignItems: "center", paddingVertical: spacing.xxl * 2 },
                  ]}
                >
                  <Ionicons
                    name="gift-outline"
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
                    No Free Signals
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      color: colors.textSecondary,
                      marginTop: spacing.sm,
                      textAlign: "center",
                    }}
                  >
                    This community hasn&apos;t posted free signals yet
                  </Text>
                </View>
              ) : (
                freeSignals.map((signal) => (
                  <UserSignalCard
                    key={signal.id}
                    signal={signal}
                    onPress={() => {}}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "vip" && (
            <>
              {!isSubscribed ? (
                <View
                  style={[
                    commonStyles.card,
                    {
                      alignItems: "center",
                      paddingVertical: spacing.xxl * 2,
                      paddingHorizontal: spacing.xl,
                      backgroundColor: colors.warning + "08",
                      borderWidth: 2,
                      borderColor: colors.warning + "30",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: borderRadius.full,
                      backgroundColor: colors.warning + "20",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: spacing.lg,
                    }}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={40}
                      color={colors.warning}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: fontSize.xl,
                      fontWeight: "700",
                      color: colors.text,
                      textAlign: "center",
                      marginBottom: spacing.sm,
                    }}
                  >
                    Premium Signals Locked
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      color: colors.textSecondary,
                      textAlign: "center",
                      lineHeight: 22,
                      marginBottom: spacing.xl,
                    }}
                  >
                    Subscribe to unlock {vipSignals.length} exclusive VIP
                    signals and get premium market insights
                  </Text>
                  <TouchableOpacity
                    onPress={handleSubscribe}
                    style={[
                      commonStyles.buttonPrimary,
                      { paddingHorizontal: spacing.xxl },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      }}
                    >
                      <Ionicons name="star" size={20} color={colors.surface} />
                      <Text style={commonStyles.buttonText}>
                        Subscribe for ₦{community.subscription_price}/mo
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : vipSignals.length === 0 ? (
                <View
                  style={[
                    commonStyles.card,
                    { alignItems: "center", paddingVertical: spacing.xxl * 2 },
                  ]}
                >
                  <Ionicons
                    name="star-outline"
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
                    No VIP Signals Yet
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      color: colors.textSecondary,
                      marginTop: spacing.sm,
                      textAlign: "center",
                    }}
                  >
                    Check back soon for premium signals
                  </Text>
                </View>
              ) : (
                vipSignals.map((signal) => (
                  <UserSignalCard
                    key={signal.id}
                    signal={signal}
                    onPress={() => {}}
                  />
                ))
              )}
            </>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
