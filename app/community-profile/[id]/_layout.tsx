import { colors } from "@/constants/theme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function CommunityProfileLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();

  if (!isLoaded || !userLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

  const role = user?.unsafeMetadata?.role;

  if (!role) return <Redirect href="/onboarding/role" />;

  if (role !== "user") return <Redirect href="/community/dashboard" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Community" }} />
      <Stack.Screen name="reviews" options={{ title: "Reviews" }} />
      <Stack.Screen
        name="create-review"
        options={{ title: "Write a Review" }}
      />
    </Stack>
  );
}
