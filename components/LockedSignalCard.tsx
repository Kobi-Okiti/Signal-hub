import { View, Text, TouchableOpacity } from "react-native";
import { Signal } from "@/types/signal";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/constants/styles";

type Props = {
  signal: Signal & {
    community?: {
      name: string;
    };
  };
  onPress: () => void;
};

export default function LockedSignalCard({ signal, onPress }: Props) {
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

  const getStatusColor = () => {
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
        padding: spacing.lg,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: getStatusColor(),
      position: "relative",
      overflow: "hidden",
      }]}
    >
      {/* Blur overlay effect */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.background + "CC",
        }}
      />

      {/* Content */}
      <View style={{ position: "relative" }}>
        {/* Header Row */}
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

            {/* Community Name */}
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              {signal.community?.name}
            </Text>
          </View>

          {/* VIP Badge & Status */}
          <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
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

            {/* Status Badge */}
            {getStatusBadge()}
          </View>
        </View>

        {/* Lock Message */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.lg,
            gap: spacing.sm,
          }}
        >
          <Ionicons name="lock-closed" size={24} color={colors.primary} />
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: "600",
              color: colors.primary,
            }}
          >
            Subscribe to unlock
          </Text>
        </View>

        {/* Time */}
        <Text
          style={{
            fontSize: fontSize.xs,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          {formatTime(signal.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}