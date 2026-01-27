import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { CommunityType } from "@/types/community";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { MarketType } from "@/types/signal";

const ALL_MARKETS: MarketType[] = ["forex", "crypto", "stocks"];

export default function CommunitySettings() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<MarketType[]>([]);
  const [initialMarkets, setInitialMarkets] = useState<MarketType[]>([]);

  const fetchCommunity = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch communities
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      console.error("Failed to fetch community:", error);
      setLoading(false);
      return;
    }

    // Fetch markets
    const { data: marketsData } = await supabase
      .from("community_markets")
      .select("market")
      .eq("community_id", data.id);

    const markets = marketsData?.map((m) => m.market) ?? [];

    setSelectedMarkets(markets);
    setInitialMarkets(markets);

    setCommunity(data);
    setName(data.name);
    setDescription(data.description ?? "");
    setSubscriptionPrice(String(data.subscription_price ?? ""));
    setLoading(false);
  }, [user]);

  // Track Markets
  const marketsChanged =
    selectedMarkets.length !== initialMarkets.length ||
    selectedMarkets.some((m) => !initialMarkets.includes(m));

  useEffect(() => {
    if (isLoaded && user) {
      fetchCommunity();
    }
  }, [isLoaded, user, fetchCommunity]);

  const handleSave = async () => {
    if (!community) return;
    const updates: Partial<CommunityType> = {};

    if (name !== community.name) updates.name = name;
    if (description !== (community.description ?? ""))
      updates.description = description;
    if (Number(subscriptionPrice) !== community.subscription_price)
      updates.subscription_price = Number(subscriptionPrice);

    // Check if Markets of Community info has been changes
    if (Object.keys(updates).length === 0 && !marketsChanged) {
      Alert.alert("Nothing to update");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("communities")
      .update(updates)
      .eq("id", community.id);

    setSaving(false);

    if (error) {
      Alert.alert("Failed to update community", error.message);
      console.error(error);
      return;
    }

    if (marketsChanged) {
      // delete existing market rows with community_id
      const { error: deleteError } = await supabase
        .from("community_markets")
        .delete()
        .eq("community_id", community.id);

      if (deleteError) {
        Alert.alert("Failed to update markets");
        setSaving(false);
        return;
      }

      // 2️⃣ insert new rows chosen
      if (selectedMarkets.length > 0) {
        const inserts = selectedMarkets.map((market) => ({
          community_id: community.id,
          market,
        }));

        const { error: insertError } = await supabase
          .from("community_markets")
          .insert(inserts);

        if (insertError) {
          Alert.alert("Failed to update markets");
          setSaving(false);
          return;
        }
      }
    }

    Alert.alert("Success", "Community updated successfully!");
    router.back();
  };

  if (loading) {
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

  if (!community) {
    return (
      <View
        style={{
          flex: 1,
          padding: spacing.xl,
          backgroundColor: colors.background,
        }}
      >
        <Text style={commonStyles.body}>No community found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: colors.background,
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
            fontSize: fontSize.xl,
            fontWeight: "800",
            color: colors.text,
            flex: 1,
          }}
        >
          Community Settings
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom:
              Platform.OS === "ios" ? spacing.xxl * 3 : spacing.xxl * 2,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Community Name */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Community Name
            </Text>
            <TextInput
              style={commonStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter community name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Description
            </Text>
            <TextInput
              style={[
                commonStyles.input,
                {
                  minHeight: 100,
                  textAlignVertical: "top",
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell traders what your community offers..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Markets You Trade
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
                marginBottom: spacing.md,
              }}
            >
              Select the markets your community focuses on
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
            >
              {ALL_MARKETS.map((market) => {
                const isActive = selectedMarkets.includes(market);

                return (
                  <TouchableOpacity
                    key={market}
                    onPress={() => {
                      setSelectedMarkets((prev) =>
                        isActive
                          ? prev.filter((m) => m !== market)
                          : [...prev, market],
                      );
                    }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderRadius: borderRadius.full,
                      borderWidth: 2,
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: isActive
                        ? colors.primary
                        : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        fontWeight: "600",
                        color: isActive ? colors.surface : colors.text,
                      }}
                    >
                      {market.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Subscription Price */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Monthly Subscription Price
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: fontSize.lg,
                  fontWeight: "600",
                  color: colors.text,
                  marginRight: spacing.sm,
                }}
              >
                ₦
              </Text>
              <TextInput
                style={[commonStyles.input, { flex: 1 }]}
                value={subscriptionPrice}
                onChangeText={setSubscriptionPrice}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              Set to 0 for free community
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[commonStyles.buttonPrimary, { opacity: saving ? 0.6 : 1 }]}
          >
            <Text style={commonStyles.buttonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
