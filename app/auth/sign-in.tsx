import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from "react";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";
import { showAlert } from "@/lib/showAlert";
import { Ionicons } from "@expo/vector-icons";

export default function SignInScreen() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingSecondFactor, setPendingSecondFactor] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<
    "email_code" | "phone_code" | "totp" | null
  >(null);
  const [code, setCode] = useState("");

  const getAuthErrorMessage = (err: any) => {
    const errorCode = err?.errors?.[0]?.code;
    const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message;

    if (errorCode === "session_exists" || errorCode === "identifier_already_signed_in") {
      return "You're already signed in on another device. Please sign out there and try again.";
    }

    if (
      errorCode === "captcha_invalid" ||
      errorCode === "captcha_missing_token" ||
      errorCode === "captcha_not_enabled"
    ) {
      return "Security check failed. Please refresh and try again.";
    }

    return message || "Failed to sign in";
  };

  const beginSecondFactor = async (strategy: "email_code" | "phone_code" | "totp") => {
    if (strategy === "email_code" || strategy === "phone_code") {
      await signIn?.prepareSecondFactor({ strategy });
    }

    setSecondFactorStrategy(strategy);
    setCode("");
    setPendingSecondFactor(true);
  };

  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      showAlert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn.create({ identifier: email });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      if (result.status !== "needs_first_factor") {
        showAlert("Error", "Sign in not complete");
        return;
      }

      const hasPassword = result.supportedFirstFactors?.some(
        (factor) => factor.strategy === "password",
      );

      if (!hasPassword) {
        showAlert("Error", "Sign in requires a different verification method.");
        return;
      }

      const attempt = await signIn.attemptFirstFactor({
        strategy: "password",
        password,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
        return;
      }

      if (attempt.status === "needs_second_factor") {
        const strategy =
          attempt.supportedSecondFactors?.[0]?.strategy ||
          result.supportedSecondFactors?.[0]?.strategy;

        if (strategy === "email_code" || strategy === "phone_code" || strategy === "totp") {
          await beginSecondFactor(strategy);
          return;
        }

        showAlert(
          "Verification required",
          "This account requires a second factor to sign in.",
        );
        return;
      }

      showAlert("Error", "Sign in not complete");
    } catch (err: any) {
      console.error(err);
      showAlert("Error", getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifySecondFactorPress = async () => {
    if (!isLoaded || !secondFactorStrategy) return;

    setLoading(true);

    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy,
        code,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
        return;
      }

      showAlert("Error", "Verification not complete");
    } catch (err: any) {
      console.error(err);
      showAlert("Error", getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (pendingSecondFactor && secondFactorStrategy) {
    const isCodeStrategy =
      secondFactorStrategy === "email_code" || secondFactorStrategy === "phone_code";

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
            <View style={{ marginBottom: spacing.xxl * 2 }}>
              <Text style={{ 
                fontSize: fontSize.xxl + 8, 
                fontWeight: "800", 
                color: colors.text,
                marginBottom: spacing.xs 
              }}>
                Verification Required
              </Text>
              <Text style={{ 
                fontSize: fontSize.md, 
                color: colors.textSecondary,
                lineHeight: 22,
              }}>
                Enter the verification code to complete sign in.
              </Text>
            </View>

            <View style={{ marginBottom: spacing.xl }}>
              <Text style={{ 
                fontSize: fontSize.sm, 
                fontWeight: "600", 
                color: colors.text,
                marginBottom: spacing.xs 
              }}>
                Verification Code
              </Text>
              <TextInput
                value={code}
                placeholder="Enter 6-digit code"
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                style={[
                  commonStyles.input,
                  {
                    fontSize: fontSize.xl,
                    textAlign: "center",
                    letterSpacing: 8,
                  },
                ]}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              onPress={onVerifySecondFactorPress}
              disabled={loading || code.length !== 6}
              style={[
                commonStyles.buttonPrimary,
                {
                  marginBottom: spacing.lg,
                  opacity: loading || code.length !== 6 ? 0.6 : 1,
                },
              ]}
            >
              <Text style={commonStyles.buttonText}>
                {loading ? "Verifying..." : "Verify"}
              </Text>
            </TouchableOpacity>

            {isCodeStrategy ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.md }}>
                  Didn&apos;t receive code?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => beginSecondFactor(secondFactorStrategy)}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: fontSize.md,
                      fontWeight: "600",
                    }}
                  >
                    Resend
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            <View style={{ position: "relative" }}>
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[commonStyles.input, { paddingRight: spacing.xxl * 2 }]}
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: spacing.lg,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password - Not Developed Yet */}
            {/* <TouchableOpacity 
              style={{ alignSelf: "flex-end", marginTop: spacing.sm }}
              onPress={() => {}}
            >
              <Text style={{ color: colors.primary, fontSize: fontSize.sm }}>
                Forgot password?
              </Text>
            </TouchableOpacity> */}
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
