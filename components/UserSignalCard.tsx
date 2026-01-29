import { View, Text, TouchableOpacity } from "react-native";
import { Signal } from "@/types/signal";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/constants/styles";

type Props = {
  signal: Signal & {
    community: {
      name: string;
    };
  };
  onPress: () => void;
};

export default function UserSignalCard({ signal, onPress }: Props) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getBorderColor = () => {
    if (signal.status === "win") return colors.success;
    if (signal.status === "loss") return colors.danger;
    return colors.border;
  };

  const getStatusBadge = () => {
  const statusConfig = {
    pending: {
      bg: colors.border + "30",
      color: colors.textSecondary,
      icon: "time-outline" as any,
    },
    win: {
      bg: colors.success + "15",
      color: colors.success,
      icon: "checkmark-circle" as any,
    },
    loss: {
      bg: colors.danger + "15",
      color: colors.danger,
      icon: "close-circle" as any,
    },
  };

  const config = statusConfig[signal.status];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: config.bg,
      }}
    >
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: "600",
          color: config.color,
        }}
      >
        {signal.status.toUpperCase()}
      </Text>
    </View>
  );
};

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        commonStyles.cardWithShadow,
        {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: getBorderColor(),
      }]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Asset & Direction */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Text
              style={{
                fontSize: fontSize.lg,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              {signal.asset.toUpperCase()}
            </Text>
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
                backgroundColor:
                  signal.direction === "buy" ? colors.buy + "15" : colors.sell + "15",
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                  color: signal.direction === "buy" ? colors.buy : colors.sell,
                }}
              >
                {signal.direction.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Community & Time */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
              }}
            >
              {signal.community?.name}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
              •
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
              }}
            >
              {formatTime(signal.created_at)}
            </Text>
          </View>
        </View>

        {/* Type & Status Badges */}
        <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
          {/* Type Badge */}
          {signal.type === "vip" ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.warning + "15",
              }}
            >
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                  color: colors.warning,
                }}
              >
                VIP
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.accent + "15",
              }}
            >
              <Ionicons name="gift-outline" size={12} color={colors.accent} />
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                  color: colors.accent,
                }}
              >
                FREE
              </Text>
            </View>
          )}

          {/* Status Badge */}
          {getStatusBadge()}
        </View>
      </View>

      {/* Price Levels */}
      <View
        style={{
          backgroundColor: colors.background,
          padding: spacing.md,
          borderRadius: borderRadius.sm,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: spacing.xs,
          }}
        >
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
            Entry
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {signal.entry_price}
          </Text>
        </View>

        {signal.take_profit && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: spacing.xs,
            }}
          >
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
              Take Profit
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.success,
              }}
            >
              {signal.take_profit}
            </Text>
          </View>
        )}

        {signal.stop_loss && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
              Stop Loss
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.danger,
              }}
            >
              {signal.stop_loss}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}