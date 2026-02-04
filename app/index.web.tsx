import { supabase } from "@/lib/supabase";
import { ensureUser } from "@/lib/web/ensureUser";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);
  const [userSynced, setUserSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;
    setLoading(false);
  }, [isLoaded, userLoaded]);

  useEffect(() => {
    if (!isLoaded || !userLoaded) return;
    if (!isSignedIn || !user) {
      setUserSynced(true);
      return;
    }

    let active = true;
    setUserSynced(false);

    ensureUser(user)
      .catch((error) => {
        console.error("ensureUser failed:", error);
      })
      .finally(() => {
        if (active) {
          setUserSynced(true);
        }
      });

    return () => {
      active = false;
    };
  }, [isLoaded, userLoaded, isSignedIn, user?.id]);

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
    !userSynced ||
    (user?.unsafeMetadata.role === "community_owner" && hasCommunity === null)
  ) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) return <Redirect href="/auth/sign-in" />;

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
