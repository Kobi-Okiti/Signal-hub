import { useUser } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Subscriber } from "@/types/subscriber";
import { colors, spacing, fontSize } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import SubscriptionCard from "@/components/SubscriptionCard";

type SubscriptionData = Subscriber & {
  community: {
    id: string;
    name: string;
    subscription_price: number;
  };
};

export default function SubscriptionsScreen() {
  const { user } = useUser();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        community:communities (
          id,
          name,
          subscription_price
        )
      `
      )
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
    } else {
      setSubscriptions(data || []);
    }

    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchSubscriptions();
    }, [fetchSubscriptions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
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

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const expiredSubscriptions = subscriptions.filter((s) => s.status === "expired");

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
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
      >
        {/* Header */}
        <Text
          style={{
            fontSize: fontSize.xxl,
            fontWeight: "800",
            color: colors.text,
            marginBottom: spacing.lg,
          }}
        >
          Subscriptions
        </Text>

        {subscriptions.length === 0 ? (
          <View
            style={[
              commonStyles.card,
              { alignItems: "center", paddingVertical: spacing.xxl * 2 },
            ]}
          >
            <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: "600",
                color: colors.text,
                marginTop: spacing.lg,
                textAlign: "center",
              }}
            >
              No Subscriptions Yet
            </Text>
            <Text
              style={{
                fontSize: fontSize.md,
                color: colors.textSecondary,
                marginTop: spacing.sm,
                textAlign: "center",
                paddingHorizontal: spacing.xl,
              }}
            >
              Subscribe to communities to unlock premium signals
            </Text>
          </View>
        ) : (
          <>
            {/* Active Subscriptions */}
            {activeSubscriptions.length > 0 && (
              <View style={{ marginBottom: spacing.xl }}>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: spacing.md,
                  }}
                >
                  Active ({activeSubscriptions.length})
                </Text>
                {activeSubscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onPress={() => router.push(`/community-profile/${sub.community.id}`)}
                  />
                ))}
              </View>
            )}

            {/* Expired Subscriptions */}
            {expiredSubscriptions.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: spacing.md,
                  }}
                >
                  Expired ({expiredSubscriptions.length})
                </Text>
                {expiredSubscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onPress={() => router.push(`/community-profile/${sub.community.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}