import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Market, MARKETS } from "@/types/market";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";

export default function CommunityOnboarding() {
  const { user } = useUser();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleMarket = (market: Market) => {
    setMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market],
    );
  };

  const createCommunity = async () => {
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    if (!name) {
      Alert.alert("Validation", "Community name is required");
      return;
    }

    if (!description) {
      Alert.alert("Validation", "Community description is required");
      return;
    }

    if (!price) {
      Alert.alert("Validation", "Community price is required");
      return;
    }

    if (markets.length === 0) {
      Alert.alert("Validation", "Select at least one market");
      return;
    }

    setLoading(true);

    try {
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .insert({
          owner_id: user.id,
          name,
          description,
          subscription_price: price ? Number(price) : null,
          status: "pending",
        })
        .select()
        .single();

      if (communityError || !community) {
        console.error(communityError);
        Alert.alert("Error", "Failed to create community");
        return;
      }

      const marketRows = markets.map((market) => ({
        community_id: community.id,
        market,
      }));

      const { error: marketsError } = await supabase
        .from("community_markets")
        .insert(marketRows);

      if (marketsError) {
        console.error(marketsError);
        Alert.alert("Error", "Failed to save markets");
        return;
      }

      router.replace("/community/dashboard");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView 
        contentContainerStyle={{ padding: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{
            fontSize: fontSize.xxl + 8,
            fontWeight: "800",
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            Create Your Community
          </Text>
          <Text style={{
            fontSize: fontSize.md,
            color: colors.textSecondary,
          }}>
            Set up your trading community and start sharing signals
          </Text>
        </View>

        <View style={{ marginBottom: spacing.xl }}>
          <Text style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            Community Name
          </Text>
          <TextInput
            placeholder="e.g., Elite Forex Signals"
            value={name}
            onChangeText={setName}
            style={[commonStyles.input, { marginBottom: spacing.lg }]}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            Description
          </Text>
          <TextInput
            placeholder="Tell traders what your community offers..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              commonStyles.input, 
              { 
                marginBottom: spacing.lg,
                minHeight: 100,
              }
            ]}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.text,
            marginBottom: spacing.xs,
          }}>
            Monthly Subscription Price
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{
              fontSize: fontSize.lg,
              fontWeight: "600",
              color: colors.text,
              marginRight: spacing.sm,
            }}>
              ₦
            </Text>
            <TextInput
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={[commonStyles.input, { flex: 1 }]}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <Text style={{
            fontSize: fontSize.xs,
            color: colors.textSecondary,
            marginTop: spacing.xs,
          }}>
            Set Subscription price for community vip members
          </Text>
        </View>

        <View style={{ marginBottom: spacing.xxl }}>
          <Text style={{
            fontSize: fontSize.sm,
            fontWeight: "600",
            color: colors.text,
            marginBottom: spacing.md,
          }}>
            Markets You Trade
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {MARKETS.map((market) => {
              const selected = markets.includes(market);

              return (
                <TouchableOpacity
                  key={market}
                  onPress={() => toggleMarket(market)}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    borderWidth: 2,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderRadius: borderRadius.full,
                  }}
                >
                  <Text style={{
                    color: selected ? colors.surface : colors.text,
                    fontSize: fontSize.sm,
                    fontWeight: "600",
                  }}>
                    {market.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          onPress={createCommunity}
          disabled={loading}
          style={[
            commonStyles.buttonPrimary,
            { opacity: loading ? 0.6 : 1 }
          ]}
        >
          <Text style={commonStyles.buttonText}>
            {loading ? "Creating..." : "Create Community"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}