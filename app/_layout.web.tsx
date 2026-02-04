import { ClerkProvider } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import { View } from "react-native";
import WebAlertHost from "@/components/web/WebAlertHost";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <View style={{ flex: 1 }}>
        <Slot />
        <WebAlertHost />
      </View>
    </ClerkProvider>
  );
}
