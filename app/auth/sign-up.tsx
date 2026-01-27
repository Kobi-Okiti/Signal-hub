import * as React from "react";
import { Text, TextInput, TouchableOpacity, View, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { colors, spacing, fontSize } from "@/constants/theme";
import { commonStyles } from "@/constants/styles";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  //Start sign-up
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!firstName || !lastName || !emailAddress || !password) {
      return Alert.alert("Error", "All fields are required");
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
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Failed to create account",
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify email
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (signUpAttempt.status !== "complete") {
        console.error("Sign-up not complete", signUpAttempt);
        Alert.alert("Error", "Verification not complete");
        setLoading(false);
        return;
      }

      await setActive({ session: signUpAttempt.createdSessionId });

      const { error } = await supabase.from("users").insert({
        id: signUpAttempt.createdUserId,
        email: emailAddress,
        role: null,
        first_name: firstName,
        last_name: lastName,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        Alert.alert("Error", "Failed to save user to database");
        setLoading(false);
        return;
      }

      router.replace("/onboarding/role");
    } catch (err: any) {
      console.error("onVerifyPress error:", err);
      Alert.alert("Error", err.message || "Failed to verify email");
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
          <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
            {/* Header */}
            <View style={{ marginBottom: spacing.xxl * 2 }}>
              <Text style={{ 
                fontSize: fontSize.xxl + 8, 
                fontWeight: "800", 
                color: colors.text,
                marginBottom: spacing.xs 
              }}>
                Check Your Email
              </Text>
              <Text style={{ 
                fontSize: fontSize.md, 
                color: colors.textSecondary,
                lineHeight: 22 
              }}>
                We&apos;ve sent a verification code to{"\n"}
                <Text style={{ fontWeight: "600", color: colors.text }}>
                  {emailAddress}
                </Text>
              </Text>
            </View>

            {/* Code Input */}
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
                style={[commonStyles.input, { 
                  fontSize: fontSize.xl,
                  textAlign: "center",
                  letterSpacing: 8 
                }]}
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
                  opacity: (loading || code.length !== 6) ? 0.6 : 1 
                }
              ]}
            >
              <Text style={commonStyles.buttonText}>
                {loading ? "Verifying..." : "Verify Email"}
              </Text>
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary, fontSize: fontSize.md }}>
                Didn&apos;t receive code?{" "}
              </Text>
              <TouchableOpacity onPress={() => signUp?.prepareEmailAddressVerification({ strategy: "email_code" })}>
                <Text style={{ 
                  color: colors.primary, 
                  fontSize: fontSize.md, 
                  fontWeight: "600" 
                }}>
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
        <View style={{ flex: 1, padding: spacing.xl, justifyContent: "center" }}>
          {/* Header */}
          <View style={{ marginBottom: spacing.xxl * 2 }}>
            <Text style={{ 
              fontSize: fontSize.xxl + 8, 
              fontWeight: "800", 
              color: colors.text,
              marginBottom: spacing.xs 
            }}>
              Create Account
            </Text>
            <Text style={{ 
              fontSize: fontSize.md, 
              color: colors.textSecondary 
            }}>
              Join the trading community
            </Text>
          </View>

          {/* Form */}
          <View style={{ marginBottom: spacing.xl }}>
            {/* Name */}
            <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: fontSize.sm, 
                  fontWeight: "600", 
                  color: colors.text,
                  marginBottom: spacing.xs 
                }}>
                  First Name
                </Text>
                <TextInput
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={commonStyles.input}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: fontSize.sm, 
                  fontWeight: "600", 
                  color: colors.text,
                  marginBottom: spacing.xs 
                }}>
                  Last Name
                </Text>
                <TextInput
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  style={commonStyles.input}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Email */}
            <Text style={{ 
              fontSize: fontSize.sm, 
              fontWeight: "600", 
              color: colors.text,
              marginBottom: spacing.xs 
            }}>
              Email
            </Text>
            <TextInput
              placeholder="john@example.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[commonStyles.input, { marginBottom: spacing.lg }]}
              placeholderTextColor={colors.textSecondary}
            />

            {/* Password */}
            <Text style={{ 
              fontSize: fontSize.sm, 
              fontWeight: "600", 
              color: colors.text,
              marginBottom: spacing.xs 
            }}>
              Password
            </Text>
            <TextInput
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              style={commonStyles.input}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={onSignUpPress}
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
              {loading ? "Creating account..." : "Continue"}
            </Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: fontSize.md }}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/auth/sign-in")}>
              <Text style={{ 
                color: colors.primary, 
                fontSize: fontSize.md, 
                fontWeight: "600" 
              }}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}