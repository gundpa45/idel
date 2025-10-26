import { AuthProvider } from "@/context/AuthContext";
import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="movie/[id]" />
      </Stack>
    </AuthProvider>
  );
}
