import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize } from "@/constants/theme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CommunityLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || user.unsafeMetadata?.role !== "community_owner") {
      setHasCommunity(null);
      return;
    }

    let active = true;

    const checkCommunity = async () => {
      const { data } = await supabase
        .from("communities")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (active) {
        setHasCommunity(!!data);
      }
    };

    checkCommunity();

    return () => {
      active = false;
    };
  }, [user?.id, user?.unsafeMetadata?.role]);

  if (!isLoaded || !userLoaded || (user?.unsafeMetadata?.role === "community_owner" && hasCommunity === null)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  const role = user?.unsafeMetadata?.role;

  if (!role) return <Redirect href="/onboarding/role" />;

  if (role !== "community_owner") return <Redirect href="/user/home" />;

  if (hasCommunity === false) return <Redirect href="/onboarding/community" />;

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
          // borderRadius: 150,
          // marginBottom: 10,
          // marginHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="subscribers"
        options={{
          title: "Subscribers",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
