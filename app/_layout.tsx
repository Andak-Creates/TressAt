import { AuthProvider, useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

SplashScreen.preventAutoHideAsync();

// Navigation guard component
function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup =
      segments[0] === "(customer-tabs)" || segments[0] === "(provider-tabs)";

    if (!user && inAuthGroup) {
      // User is not signed in but trying to access protected route
      router.replace("/");
    } else if (user && !inAuthGroup) {
      // User is signed in but on public route, redirect based on role
      if (role === "customer") {
        router.replace("/(customer-tabs)/Home");
      } else if (role === "provider") {
        router.replace("/(provider-tabs)/Home"); // or wherever providers go
      }
    }
  }, [user, role, segments, loading]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log("Session", data);
      } catch (err) {
        console.error("Error initializing app:", err);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            <NavigationGuard>
              <Stack screenOptions={{ headerShown: false }} />
            </NavigationGuard>
          </BottomSheetModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
