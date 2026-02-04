import { colors } from "@/constants/theme";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import RoleSelection from "../../components/web/role-ui";

export default function RoleSelectionWeb() {
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

  if (role === "user") return <Redirect href="/user/home" />;

  if (role === "community_owner")
    return <Redirect href="/onboarding/community" />;

  return <RoleSelection />;
}
