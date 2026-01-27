import { Text, View } from "react-native";
import { SubscriberWithUser } from "@/types/subscriber";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  subscriber: SubscriberWithUser;
};

export default function SubscriberCard({ subscriber }: Props) {
  const { users, start_date, end_date, status } = subscriber;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
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
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: status === "active" ? colors.success : colors.border,
      }}
    >
      {/* User Info */}
      <View style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {`${users.first_name ?? ""} ${users.last_name ?? ""}`.trim() || "Unknown User"}
          </Text>
          
          {isExpiringSoon && (
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
                backgroundColor: colors.warning + '15',
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: "600",
                  color: colors.warning,
                }}
              >
                Expiring Soon
              </Text>
            </View>
          )}
        </View>
        
        <Text
          style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          {users.email}
        </Text>
      </View>

      {/* Subscription Timeline */}
      <View
        style={{
          backgroundColor: colors.background,
          padding: spacing.md,
          borderRadius: borderRadius.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.md }}>
          {/* Start Date */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
                marginBottom: 2,
              }}
            >
              Started
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
              }}
            >
              {formatDate(start_date)}
            </Text>
          </View>

          {/* Arrow/Progress */}
          <Ionicons 
            name="arrow-forward" 
            size={16} 
            color={colors.textSecondary}
            style={{ marginHorizontal: spacing.sm }}
          />

          {/* End Date */}
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
                marginBottom: 2,
              }}
            >
              {daysLeft > 0 ? "Renews" : "Ended"}
            </Text>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: daysLeft > 0 ? colors.text : colors.danger,
              }}
            >
              {formatDate(end_date)}
            </Text>
          </View>
        </View>

        {/* Days Remaining Highlight */}
        {daysLeft > 0 && (
          <View
            style={{
              paddingTop: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="time-outline"
              size={14}
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
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}