import { useAuth, useSignUp, useUser } from "@clerk/clerk-expo";
import { Redirect, useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { commonStyles } from "@/constants/styles";
import { colors, fontSize, spacing } from "@/constants/theme";
import { supabase } from "../../lib/supabase";
import { showAlert } from "@/lib/showAlert";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreenWeb() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (!isLoaded || !userLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isSignedIn) return <Redirect href="/" />;

  //Start sign-up
  const onSignUpPress = async () => {
    if (!signUpLoaded) return;

    if (!firstName || !lastName || !emailAddress || !password) {
      return showAlert("Error", "All fields are required");
    }

    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(err);
      showAlert("Error", err.errors?.[0]?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const onVerifyPress = async () => {
    if (!signUpLoaded) return;

    setLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status !== "complete") {
        console.error("Sign-up not complete", signUpAttempt);
        showAlert("Error", "Verification not complete");
        setLoading(false);
        return;
      }

      const createdUserId = signUpAttempt.createdUserId;

      if (!createdUserId) {
        showAlert("Error", "Sign up completed but no user id was returned.");
        setLoading(false);
        return;
      }

      await setActive({ session: signUpAttempt.createdSessionId });

      const { data: existingUser, error: existingError } = await supabase
        .from("users")
        .select("id")
        .eq("email", emailAddress)
        .maybeSingle();

      if (existingError) {
        console.error("Supabase lookup error:", existingError);
        showAlert("Error", existingError.message || "Failed to save user to database");
        setLoading(false);
        return;
      }

      if (existingUser && existingUser.id !== createdUserId) {
        showAlert(
          "Account already exists",
          "An account with this email already exists. Please sign in instead.",
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("users")
        .upsert(
          {
            id: createdUserId,
            email: emailAddress,
            role: null,
            first_name: firstName,
            last_name: lastName,
          },
          { onConflict: "id" },
        );

      if (error) {
        console.error("Supabase insert error:", error);
        showAlert("Error", error.message || "Failed to save user to database");
        setLoading(false);
        return;
      }

      router.replace("/onboarding/role");
    } catch (err: any) {
      console.error("onVerifyPress error:", err);
      showAlert("Error", err.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  // Verify Email View Component
  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}
          >
            {/* Header */}
            <View style={{ marginBottom: spacing.xxl * 2 }}>
              <Text
                style={{
                  fontSize: fontSize.xxl + 8,
                  fontWeight: "800",
                  color: colors.text,
                  marginBottom: spacing.xs,
                }}
              >
                Check Your Email
              </Text>
              <Text
                style={{
                  fontSize: fontSize.md,
                  color: colors.textSecondary,
                  lineHeight: 22,
                }}
              >
                We&apos;ve sent a verification code to{"\n"}
                <Text style={{ fontWeight: "600", color: colors.text }}>
                  {emailAddress}
                </Text>
              </Text>
            </View>

            {/* Code Input */}
            <View style={{ marginBottom: spacing.xl }}>
              <Text
                style={{
                  fontSize: fontSize.sm,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: spacing.xs,
                }}
              >
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

            {/* Verify Button */}
            <TouchableOpacity
              onPress={onVerifyPress}
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
                {loading ? "Verifying..." : "Verify Email"}
              </Text>
            </TouchableOpacity>

            {/* Resend Code */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.textSecondary, fontSize: fontSize.md }}
              >
                Didn&apos;t receive code?{" "}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  signUp?.prepareEmailAddressVerification({
                    strategy: "email_code",
                  })
                }
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Sign Up Form
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}
        >
          {/* Header */}
          <View style={{ marginBottom: spacing.xxl * 2 }}>
            <Text
              style={{
                fontSize: fontSize.xxl + 8,
                fontWeight: "800",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Create Account
            </Text>
            <Text
              style={{
                fontSize: fontSize.md,
                color: colors.textSecondary,
              }}
            >
              Join the trading community
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: spacing.xl }}>
            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              First Name
            </Text>
            <TextInput
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
              style={[commonStyles.input, { marginBottom: spacing.lg }]}
              placeholderTextColor={colors.textSecondary}
            />

            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Last Name
            </Text>
            <TextInput
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
              style={[commonStyles.input, { marginBottom: spacing.lg }]}
              placeholderTextColor={colors.textSecondary}
            />

            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
              Email
            </Text>
            <TextInput
              placeholder="Enter your email"
              value={emailAddress}
              onChangeText={setEmailAddress}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[commonStyles.input, { marginBottom: spacing.lg }]}
              placeholderTextColor={colors.textSecondary}
            />

            <Text
              style={{
                fontSize: fontSize.sm,
                fontWeight: "600",
                color: colors.text,
                marginBottom: spacing.xs,
              }}
            >
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
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={onSignUpPress}
            disabled={loading}
            style={[
              commonStyles.buttonPrimary,
              {
                marginBottom: spacing.lg,
                opacity: loading ? 0.6 : 1,
              },
            ]}
          >
            <Text style={commonStyles.buttonText}>
              {loading ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View
            style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.md }}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/sign-in")}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: fontSize.md,
                  fontWeight: "600",
                }}
              >
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
