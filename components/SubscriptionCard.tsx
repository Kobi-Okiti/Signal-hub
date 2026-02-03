import { View, Text, TouchableOpacity } from "react-native";
import { Subscriber } from "@/types/subscriber";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

type SubscriptionData = Subscriber & {
  community: {
    id: string;
    name: string;
    subscription_price: number;
  };
};

type Props = {
  subscription: SubscriptionData;
  onPress: () => void;
};

export default function SubscriptionCard({ subscription, onPress }: Props) {
  const { community, start_date, end_date, status } = subscription;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = () => {
    const end = new Date(end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeft = getDaysRemaining();
  const isActive = status === "active";
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        commonStyles.cardWithShadow,
        {
          padding: spacing.lg,
          marginBottom: spacing.md,
          borderLeftWidth: 4,
          borderLeftColor: isActive ? colors.success : colors.danger,
        },
      ]}
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
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {community.name}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            ₦{community.subscription_price.toLocaleString()}/month
          </Text>
        </View>

        {/* Status Badge */}
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.sm,
            backgroundColor: isActive ? colors.success + "15" : colors.danger + "15",
          }}
        >
          <Text
            style={{
              fontSize: fontSize.xs,
              fontWeight: "600",
              color: isActive ? colors.success : colors.danger,
            }}
          >
            {isActive ? "Active" : "Expired"}
          </Text>
        </View>
      </View>

      {/* Subscription Timeline */}
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
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
            Started
          </Text>
          <Text
            style={{
              fontSize: fontSize.xs,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {formatDate(start_date)}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
            {daysLeft > 0 ? "Renews" : "Ended"}
          </Text>
          <Text
            style={{
              fontSize: fontSize.xs,
              fontWeight: "600",
              color: daysLeft > 0 ? colors.text : colors.danger,
            }}
          >
            {formatDate(end_date)}
          </Text>
        </View>
      </View>

      {/* Days Remaining Highlight */}
      {daysLeft > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.sm,
            backgroundColor: isExpiringSoon
              ? colors.warning + "15"
              : colors.success + "10",
          }}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={isExpiringSoon ? colors.warning : colors.success}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              fontSize: fontSize.sm,
              fontWeight: "600",
              color: isExpiringSoon ? colors.warning : colors.success,
            }}
          >
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
          </Text>
          {isExpiringSoon && (
            <View
              style={{
                marginLeft: spacing.sm,
                paddingHorizontal: spacing.xs,
                paddingVertical: 2,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.warning,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xs - 2,
                  fontWeight: "700",
                  color: colors.surface,
                }}
              >
                RENEW SOON
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.danger + "15",
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.danger}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              fontSize: fontSize.sm,
              fontWeight: "600",
              color: colors.danger,
            }}
          >
            Subscription ended
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}