import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";

export default function SignInScreen() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        Alert.alert("Error", "Sign in not complete");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.errors?.[0]?.message || "Failed to sign in");
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
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
          {/* Header */}
          <View style={{ marginBottom: spacing.xxl * 2 }}>
            <Text style={{ 
              fontSize: fontSize.xxl + 8, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: spacing.xs 
            }}>
              Welcome Back
            </Text>
            <Text style={{ 
              fontSize: fontSize.md, 
              color: colors.textSecondary 
            }}>
              Sign in to continue trading
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ 
              fontSize: fontSize.sm, 
              fontWeight: "600", 
              color: colors.text,
              marginBottom: spacing.xs 
            }}>
              Email
            </Text>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[commonStyles.input, { marginBottom: spacing.lg }]}
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={{ 
              fontSize: fontSize.sm, 
              fontWeight: "600", 
              color: colors.text,
              marginBottom: spacing.xs 
            }}>
              Password
            </Text>
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              style={commonStyles.input}
              placeholderTextColor={colors.textSecondary}
            />

            {/* Forgot Password - Not Developed Yet */}
            <TouchableOpacity 
              style={{ alignSelf: "flex-end", marginTop: spacing.sm }}
              onPress={() => {}}
            >
              <Text style={{ color: colors.primary, fontSize: fontSize.sm }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={onSignInPress}
            disabled={loading}
            style={[
              commonStyles.buttonPrimary, 
              { 
                marginBottom: spacing.lg,
                opacity: loading ? 0.6 : 1 
              }
            ]}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link Route */}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.md }}>
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/sign-up")}>
              <Text style={{ 
                color: colors.primary, 
                fontSize: fontSize.md, 
                fontWeight: "600" 
              }}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}