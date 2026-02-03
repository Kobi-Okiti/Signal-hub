import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/sign-in");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
          Profile
        </Text>

        {/* Account Info Card */}
        <View style={[commonStyles.card, { marginBottom: spacing.lg }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: spacing.md,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: borderRadius.full,
                backgroundColor: colors.primary + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.xl,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {user?.firstName} {user?.lastName}
              </Text>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {user?.emailAddresses?.[0]?.emailAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Community Section */}
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: spacing.md,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Community
        </Text>

        {/* Followed Communities */}
        <TouchableOpacity
          style={[commonStyles.card, { marginBottom: spacing.md }]}
          onPress={() => router.push("/user/profile/followed-communities")}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.secondary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="people-outline" size={20} color={colors.secondary} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Followed Communities
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Manage communities you follow
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* My Subscriptions */}
        <TouchableOpacity
          style={[commonStyles.card, { marginBottom: spacing.lg }]}
          onPress={() => router.push("/user/subscriptions")}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.warning + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="star-outline" size={20} color={colors.warning} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: fontSize.md,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  My Subscriptions
                </Text>
                <Text
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  View your active subscriptions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Account Section */}
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.textSecondary,
            marginBottom: spacing.md,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Account
        </Text>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            commonStyles.card,
            {
              borderWidth: 1,
              borderColor: colors.danger + "30",
              backgroundColor: colors.danger + "08",
            },
          ]}
          onPress={handleLogout}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: borderRadius.md,
                backgroundColor: colors.danger + "15",
                alignItems: "center",
                justifyContent: "center",
                marginRight: spacing.md,
              }}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <Text
              style={{
                fontSize: fontSize.md,
                fontWeight: "600",
                color: colors.danger,
              }}
            >
              Logout
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}