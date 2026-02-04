import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize } from "@/constants/theme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";

export default function UserLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  if (!isLoaded || !userLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  const role = user?.unsafeMetadata?.role;

  if (!role) return <Redirect href="/onboarding/role" />;

  if (role !== "user") return <Redirect href="/community/dashboard" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="subscriptions"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
