import { Stack } from "expo-router";

export default function Profile() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="followed-communities"
        options={{ title: "Followed Communities" }}
      />
    </Stack>
  );
}
