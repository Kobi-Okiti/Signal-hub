import { View, Text } from "react-native";
import { Review } from "@/types/review";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  review: Review;
};

function fullName(u?: { first_name: string | null; last_name: string | null }) {
  const name = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim();
  return name.length ? name : "Anonymous";
}

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewCard({ review }: Props) {
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= review.rating ? "star" : "star-outline"}
          size={16}
          color={i <= review.rating ? colors.warning : colors.border}
        />
      );
    }
    return stars;
  };

  return (
    <View
      style={[
        commonStyles.cardWithShadow,
        {
          padding: spacing.lg,
          marginBottom: spacing.md,
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
          {/* User Avatar & Name */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.full,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {review.users?.first_name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {fullName(review.users)}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xs,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {formatDate(review.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating */}
        <View style={{ alignItems: "flex-end" }}>
          <View
            style={{
              flexDirection: "row",
              gap: 2,
              marginBottom: spacing.xs,
            }}
          >
            {renderStars()}
          </View>
          <Text
            style={{
              fontSize: fontSize.xs,
              fontWeight: "600",
              color: colors.textSecondary,
            }}
          >
            {review.rating}.0 / 5.0
          </Text>
        </View>
      </View>

      {/* Review Text */}
      {review.review && (
        <Text
          style={{
            fontSize: fontSize.md,
            color: colors.text,
            lineHeight: 22,
          }}
        >
          {review.review}
        </Text>
      )}
    </View>
  );
}