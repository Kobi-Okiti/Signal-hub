import { View, Text, TouchableOpacity } from "react-native";
import { CommunityType } from "@/types/community";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
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

type Props = {
  community: CommunityWithStats;
  onPress: () => void;
};

export default function CommunityCard({ community, onPress }: Props) {
  const totalSignals = community.community_stats?.total_signals ?? 0;
  const winRate = community.community_stats?.win_rate ?? 0;

  // 3-tier win rate system
  const getWinRateConfig = () => {
    if (winRate >= 65) {
      return {
        color: colors.success,
        icon: "trending-up" as const,
        label: "Excellent",
      };
    } else if (winRate >= 50) {
      return {
        color: colors.warning,
        icon: "remove-outline" as const,
        label: "Good",
      };
    } else {
      return {
        color: colors.danger,
        icon: "trending-down" as const,
        label: "Poor",
      };
    }
  };

  const winRateConfig = totalSignals > 0 ? getWinRateConfig() : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        commonStyles.cardWithShadow,
        {
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing.sm }}>
        <Text
          style={{
            fontSize: fontSize.lg,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          {community.name}
        </Text>

        {community.description && (
          <Text
            style={{
              marginTop: spacing.xs,
              fontSize: fontSize.sm,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {community.description}
          </Text>
        )}
      </View>

      {/* Markets */}
      {community.markets && community.markets.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.xs,
            marginBottom: spacing.md,
          }}
        >
          {community.markets.map((m) => (
            <View
              key={m.market}
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
                {m.market.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Stats Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {/* Price */}
        <View>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            Subscription
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: "700",
              color:
                community.subscription_price === 0 ? colors.success : colors.text,
            }}
          >
            {community.subscription_price === 0
              ? "Free"
              : `₦${community.subscription_price}/mo`}
          </Text>
        </View>

        {/* Win Rate */}
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            Win Rate
          </Text>
          {totalSignals === 0 ? (
            <Text
              style={{
                fontSize: fontSize.md,
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
                size={16}
                color={winRateConfig!.color}
              />
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: winRateConfig!.color,
                }}
              >
                {winRate}%
              </Text>
            </View>
          )}
        </View>

        {/* Total Signals */}
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: fontSize.xs,
              color: colors.textSecondary,
              marginBottom: 2,
            }}
          >
            Signals
          </Text>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {totalSignals}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}