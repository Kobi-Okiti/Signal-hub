import { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { authStyles } from "@/constants/authStyles"; 
import { showAlert } from "@/lib/showAlert";

const RATINGS = [1, 2, 3, 4, 5] as const;

export default function CreateReviewScreen() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{ id?: string }>();

  const communityId = useMemo(() => params.id ?? "", [params.id]);

  const [rating, setRating] = useState<(typeof RATINGS)[number]>(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    if (!user) {
      showAlert("Error", "You must be signed in.");
      return;
    }

    if (!communityId) {
      showAlert("Error", "Missing community id.");
      return;
    }

    const trimmed = review.trim();
    if (!trimmed) {
      showAlert("Validation", "Please write a review.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        community_id: communityId,
        rating,
        review: trimmed,
      });

      if (error) {
        console.error("Insert review error:", error);
        showAlert("Error", "Failed to submit review.");
        return;
      }

      showAlert("Success", "Review submitted!");
      router.replace(`/community-profile/${communityId}/reviews`);
      
    } catch (e) {
      console.error(e);
      showAlert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      {/* Header with back button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: spacing.md,
            width: 40,
            height: 40,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: fontSize.xl,
            fontWeight: "800",
            color: colors.text,
            flex: 1,
          }}
        >
          Post a Review / Complaint
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={authStyles.inputLabel}>Rating</Text>
          <View style={styles.ratingContainer}>
            {RATINGS.map((r) => {
              const active = r === rating;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRating(r)}
                  style={[
                    styles.ratingButton,
                    active && styles.ratingButtonActive
                  ]}
                >
                  <Text style={[
                    styles.ratingText,
                    active && styles.ratingTextActive
                  ]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Review Section */}
        <View style={styles.section}>
          <Text style={authStyles.inputLabel}>Review / Complaint</Text>
          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="Write your feedback here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            style={[commonStyles.input, styles.textArea]}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          disabled={loading}
          onPress={submitReview}
          style={[
            commonStyles.buttonPrimary,
            styles.submitButton,
            loading && { opacity: 0.6 }
          ]}
        >
          <Text style={commonStyles.buttonText}>
            {loading ? "Submitting..." : "Submit Review"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    flexWrap: 'wrap' as const,
    marginTop: spacing.sm,
  },
  ratingButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 50,
    alignItems: 'center' as const,
  },
  ratingButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  ratingText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700' as const,
  },
  ratingTextActive: {
    color: colors.surface,
  },
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top' as const,
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
};