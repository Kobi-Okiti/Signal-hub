import { colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import CommunityOnboarding from "../../components/web/community-ui";

export default function CommunityOnboardingWeb() {
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

  if (
    !isLoaded ||
    !userLoaded ||
    (user?.unsafeMetadata?.role === "community_owner" && hasCommunity === null)
  ) {
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

  if (hasCommunity) return <Redirect href="/community/dashboard" />;

  return <CommunityOnboarding />;
}
