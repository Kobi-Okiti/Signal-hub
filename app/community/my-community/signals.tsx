import { useCallback, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import SignalCard from "@/components/SignalCard";
import { Signal } from "@/types/signal";
import { colors, fontSize, spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/constants/styles";

export default function MyCommunitySignals() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSignals = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // 1️⃣ Get community id
    const { data: community } = await supabase
      .from("communities")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!community) {
      setLoading(false);
      return;
    }

    // 2️⃣ Fetch all signals for community
    const { data } = await supabase
      .from("signals")
      .select("*")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false });

    setSignals(data ?? []);
    setLoading(false);
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSignals();
    setRefreshing(false);
  };

  // Refesh screen on refocus
  useFocusEffect(
    useCallback(() => {
      if (!isLoaded || !user) return;
      fetchSignals();
    }, [fetchSignals, isLoaded, user]),
  );

  const handleSignalUpdate = (id: string, status: "win" | "loss") => {
    setSignals((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  if (loading && !refreshing) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header - Outside KeyboardAvoidingView to give it the static feel */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.xl,
          paddingBottom: spacing.lg,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: spacing.md,
            padding: spacing.xs,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: fontSize.xxl,
            fontWeight: "800",
            color: colors.text,
            flex: 1,
          }}
        >
          Signal History
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ paddingHorizontal: spacing.xl }}>
          {signals.length === 0 ? (
            <View
              style={[
                commonStyles.card,
                { alignItems: "center", paddingVertical: spacing.xxl },
              ]}
            >
              <Ionicons
                name="analytics-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  commonStyles.caption,
                  { marginTop: spacing.md, textAlign: "center" },
                ]}
              >
                No signals yet. Create your first signal to get started!
              </Text>
            </View>
          ) : (
            signals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                onUpdated={(status) => handleSignalUpdate(signal.id, status)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
