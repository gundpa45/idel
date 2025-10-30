import { AuthProvider } from "@/context/AuthContext";
import { ParentalControlProvider } from "@/context/ParentalControlContext";
import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <ParentalControlProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="movie/[id]" />
        </Stack>
      </ParentalControlProvider>
    </AuthProvider>
  );
}
