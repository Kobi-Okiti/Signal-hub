import { Stack } from "expo-router";

export default function MyCommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "My Community" }}
      />
      <Stack.Screen
        name="new-signals"
        options={{ title: "New Signal" }}
      />
      <Stack.Screen
        name="signals"
        options={{ title: "Signal History" }}
      />
      <Stack.Screen
        name="reviews"
        options={{ title: "Review History" }}
      />
    </Stack>
  );
}
