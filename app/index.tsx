import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { supabase } from "../lib/supabase";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoaded && userLoaded) setLoading(false);
  }, [isLoaded, userLoaded]);

  useEffect(() => {
    if (!user || user.unsafeMetadata.role !== "community_owner") {
      setHasCommunity(null);
      return;
    }

    const checkCommunity = async () => {
      const { data } = await supabase
        .from("communities")
        .select("id")
        .eq("owner_id", user.id)
        .single();
        

      setHasCommunity(!!data);
    };

    checkCommunity();
  }, [user]);

  if (
    loading ||
  (user?.unsafeMetadata.role === "community_owner" && hasCommunity === null)
  ) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/auth/sign-up" />;

  if (!user?.unsafeMetadata.role) return <Redirect href="/onboarding/role" />;

  switch (user.unsafeMetadata.role) {
    case "user":
      return <Redirect href="/user/home" />;

    case "community_owner":
      return hasCommunity ? (
        <Redirect href="/community/dashboard" />
      ) : (
        <Redirect href="/onboarding/community" />
      );

    default:
      return <Redirect href="/onboarding/role" />;
  }
}
