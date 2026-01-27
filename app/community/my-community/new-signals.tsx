import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { MARKET_ASSETS, Market } from "@/types/market";
import { MarketType, SignalType } from "@/types/signal";
import { CommunityType } from "@/types/community";
import { colors, spacing, fontSize, borderRadius } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { Ionicons } from "@expo/vector-icons";

export default function NewSignalScreen() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [community, setCommunity] = useState<CommunityType | null>(null);
  const [communityMarkets, setCommunityMarkets] = useState<Market[]>([]);
  const [market, setMarket] = useState<MarketType>("forex");
  const [asset, setAsset] = useState(MARKET_ASSETS.forex[0]);
  const [type, setType] = useState<SignalType>("free");
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [entryPrice, setEntryPrice] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showMarketPicker, setShowMarketPicker] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  const fetchCommunity = useCallback(async () => {
    if (!user) return;

    const { data: communityData, error } = await supabase
      .from("communities")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setCommunity(communityData);

    // Fetch community markets
    const { data: marketsData } = await supabase
      .from("community_markets")
      .select("market")
      .eq("community_id", communityData.id);

    const markets = marketsData?.map((m) => m.market) ?? [];
    setCommunityMarkets(markets);

    // Set default market to first available
    if (markets.length > 0) {
      const firstMarket = markets[0] as MarketType;
      setMarket(firstMarket);
      setAsset(MARKET_ASSETS[firstMarket][0]);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetchCommunity();
  }, [isLoaded, user, fetchCommunity]);

  const handleMarketChange = (value: MarketType) => {
    setMarket(value);
    setAsset(MARKET_ASSETS[value][0]);
    setShowMarketPicker(false);
  };

  const handleAssetChange = (value: string) => {
    setAsset(value);
    setShowAssetPicker(false);
  };

  const handleCreateSignal = async () => {
    if (!community) return;

    // Validate market
    if (!communityMarkets.includes(market as Market)) {
      Alert.alert(
        "Invalid Market",
        `Your community doesn't trade in ${market}. Please select a market you've registered for.`,
      );
      return;
    }

    if (!entryPrice) {
      Alert.alert("Missing info", "Entry price is required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("signals").insert({
      community_id: community.id,
      asset,
      market,
      type,
      direction,
      entry_price: Number(entryPrice),
      take_profit: takeProfit ? Number(takeProfit) : null,
      stop_loss: stopLoss ? Number(stopLoss) : null,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    router.back();
  };

  // Custom Picker Component
  const CustomPicker = ({
    label,
    value,
    options,
    onSelect,
    visible,
    onClose,
  }: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onSelect: (value: any) => void;
    visible: boolean;
    onClose: () => void;
  }) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.lg,
              borderTopRightRadius: borderRadius.lg,
              paddingBottom: spacing.xxl,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: fontSize.lg, fontWeight: "600" }}>
                {label}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={{
                    padding: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor:
                      value === option.value
                        ? colors.primary + "10"
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize.md,
                      color:
                        value === option.value ? colors.primary : colors.text,
                      fontWeight: value === option.value ? "600" : "400",
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // Custom Segmented Control
  const CustomSegmentedControl = ({
    options,
    selected,
    onSelect,
  }: {
    options: { label: string; value: string; color?: string }[];
    selected: string;
    onSelect: (value: any) => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: 4,
      }}
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.sm,
              backgroundColor: isSelected
                ? option.color || colors.primary
                : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: isSelected ? colors.surface : colors.text,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!community || communityMarkets.length === 0) {
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

  const availableMarkets = communityMarkets.map((m) => ({
    label: m.charAt(0).toUpperCase() + m.slice(1),
    value: m,
  }));

  const availableAssets = MARKET_ASSETS[market].map((a) => ({
    label: a,
    value: a,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header - Outside KeyboardAvoidingView */}
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
            fontSize: fontSize.xxl,
            fontWeight: "800",
            color: colors.text,
            flex: 1,
          }}
        >
          Create Signal
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: spacing.xl,
            paddingBottom: Platform.OS === "ios" ? spacing.xxl * 3 : spacing.xxl * 2,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Market */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Market
            </Text>
            <TouchableOpacity
              onPress={() => setShowMarketPicker(true)}
              style={[
                commonStyles.input,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ fontSize: fontSize.md, color: colors.text }}>
                {market.charAt(0).toUpperCase() + market.slice(1)}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Asset */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Asset
            </Text>
            <TouchableOpacity
              onPress={() => setShowAssetPicker(true)}
              style={[
                commonStyles.input,
                {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
            >
              <Text style={{ fontSize: fontSize.md, color: colors.text }}>
                {asset}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Signal Type */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Signal Type
            </Text>
            <CustomSegmentedControl
              options={[
                { label: "FREE", value: "free" },
                { label: "VIP", value: "vip" },
              ]}
              selected={type}
              onSelect={setType}
            />
          </View>

          {/* Direction */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Direction
            </Text>
            <CustomSegmentedControl
              options={[
                { label: "BUY", value: "buy", color: colors.buy },
                { label: "SELL", value: "sell", color: colors.sell },
              ]}
              selected={direction}
              onSelect={setDirection}
            />
          </View>

          {/* Entry Price */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Entry Price *
            </Text>
            <TextInput
              style={commonStyles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={entryPrice}
              onChangeText={setEntryPrice}
            />
          </View>

          {/* Take Profit */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Take Profit (Optional)
            </Text>
            <TextInput
              style={commonStyles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={takeProfit}
              onChangeText={setTakeProfit}
            />
          </View>

          {/* Stop Loss */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Stop Loss (Optional)
            </Text>
            <TextInput
              style={commonStyles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={stopLoss}
              onChangeText={setStopLoss}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleCreateSignal}
            disabled={loading}
            style={[commonStyles.buttonPrimary, { opacity: loading ? 0.6 : 1 }]}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? "Posting..." : "Post Signal"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <CustomPicker
        label="Select Market"
        value={market}
        options={availableMarkets}
        onSelect={handleMarketChange}
        visible={showMarketPicker}
        onClose={() => setShowMarketPicker(false)}
      />

      <CustomPicker
        label="Select Asset"
        value={asset}
        options={availableAssets}
        onSelect={handleAssetChange}
        visible={showAssetPicker}
        onClose={() => setShowAssetPicker(false)}
      />
    </View>
  );
}