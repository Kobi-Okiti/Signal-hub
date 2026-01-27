import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Signal } from "@/types/signal";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

type SignalStatus = "pending" | "win" | "loss";

type Props = {
  signal: Signal;
  onUpdated?: (status: "win" | "loss") => void;
};

export default function SignalCard({ signal, onUpdated }: Props) {
  const [status, setStatus] = useState<SignalStatus>(signal.status);
  const [updating, setUpdating] = useState(false);
  const isResolved = status !== "pending";

  const resolveSignal = (result: "win" | "loss") => {
    Alert.alert(
      "Confirm Result",
      `Mark this signal as ${result.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpdating(true);
            const previousStatus = status;
            setStatus(result);

            const { error } = await supabase
              .from("signals")
              .update({ status: result })
              .eq("id", signal.id)
              .eq("status", "pending");

            if (error) {
              console.error("Signal update error:", error);
              setStatus(previousStatus);
              Alert.alert("Error", "Failed to update signal");
            } else {
              onUpdated?.(result);
            }

            setUpdating(false);
          },
        },
      ],
    );
  };

  const getBorderColor = () => {
    if (status === "win") return colors.success;
    if (status === "loss") return colors.danger;
    return colors.border;
  };

  const getStatusBadge = () => {
    if (status === "pending") return null;

    return (
      <View
        style={{
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
          backgroundColor:
            status === "win" ? colors.success + "15" : colors.danger + "15",
        }}
      >
        <Text
          style={{
            fontSize: fontSize.xs,
            fontWeight: "600",
            color: status === "win" ? colors.success : colors.danger,
          }}
        >
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
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

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: getBorderColor(),
      }}
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
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
                  signal.direction === "buy"
                    ? colors.buy + "15"
                    : colors.sell + "15",
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

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <Text
              style={{ fontSize: fontSize.xs, color: colors.textSecondary }}
            >
              {signal.market.toUpperCase()}
            </Text>
            <Text
              style={{ fontSize: fontSize.xs, color: colors.textSecondary }}
            >
              •
            </Text>
            <Text
              style={{ fontSize: fontSize.xs, color: colors.textSecondary }}
            >
              {formatDate(signal.created_at)}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
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
          {getStatusBadge()}
        </View>
      </View>

      {/* Price Levels */}
      <View
        style={{
          backgroundColor: colors.background,
          padding: spacing.md,
          borderRadius: borderRadius.sm,
          marginBottom: spacing.md,
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
            <Text
              style={{ fontSize: fontSize.sm, color: colors.textSecondary }}
            >
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
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{ fontSize: fontSize.sm, color: colors.textSecondary }}
            >
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

      {/* Actions - Only show if pending */}
      {!isResolved && (
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TouchableOpacity
            disabled={updating}
            onPress={() => resolveSignal("win")}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.success,
              opacity: updating ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: colors.surface,
                fontSize: fontSize.sm,
                fontWeight: "600",
              }}
            >
              Mark as Win
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={updating}
            onPress={() => resolveSignal("loss")}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              borderRadius: borderRadius.sm,
              backgroundColor: colors.danger,
              opacity: updating ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: colors.surface,
                fontSize: fontSize.sm,
                fontWeight: "600",
              }}
            >
              Mark as Loss
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
