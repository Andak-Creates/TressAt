// lib/supabase.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ✅ Keep session across reloads
    storage: AsyncStorage, // ✅ Use React Native AsyncStorage
    autoRefreshToken: true, // ✅ Refresh token automatically
    detectSessionInUrl: false, // React Native doesn’t need URL detection
  },
});
