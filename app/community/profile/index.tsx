import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ padding: spacing.xl, paddingBottom: spacing.lg }}>
          <Text
            style={{
              fontSize: fontSize.xxl,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Profile
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.xl }}>
          
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

          {/* Settings Section */}
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
            Settings
          </Text>

          {/* Community Settings */}
          <TouchableOpacity
            style={[commonStyles.card, { marginBottom: spacing.md }]}
            onPress={() => router.push("/community/profile/community-settings")}
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
                    backgroundColor: colors.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: spacing.md,
                  }}
                >
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      fontWeight: "600",
                      color: colors.text,
                    }}
                  >
                    Community Settings
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize.xs,
                      color: colors.textSecondary,
                      marginTop: 2,
                    }}
                  >
                    Manage your community details
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          {/* Account Section */}
          <Text
            style={{
              fontSize: fontSize.sm,
              fontWeight: "600",
              color: colors.textSecondary,
              marginBottom: spacing.md,
              marginTop: spacing.lg,
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
              }
            ]}
            onPress={handleSignOut}
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
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={colors.danger}
                />
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
        </View>
      </ScrollView>
    </View>
  );
}