import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // 🔹 Get user location
  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need location access to continue");
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
    });
    Alert.alert("Location Set", "Your location has been captured!");
  };

  const handleFakePayment = async () => {
    if (!location) {
      Alert.alert("Location Required", "Please set your location first.");
      return;
    }

    setLoading(true);
    Alert.alert("Processing...", "Simulating payment confirmation...");

    try {
      // ✅ Use the signUp function from AuthContext
      // It will create both profile and provider records
      await signUp(
        String(params.email),
        "temporarypassword123", // You might want to get this from params too
        "provider",
        String(params.fullName),
        String(params.phone),
        location
      );

      console.log("✅ Sign up completed");

      // ✅ Check if provider record exists, if not create it, otherwise update it
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("🔵 Current user:", user?.id);

      if (user) {
        // Check if provider record exists
        const { data: existingProvider } = await supabase
          .from("providers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (existingProvider) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("providers")
            .update({
              account_type: params.account_type,
              business_name: params.business_name,
              specialties: [params.role],
              subscription_plan: "basic",
              is_active: true,
            })
            .eq("id", user.id);

          if (updateError) throw updateError;
        } else {
          // Create new provider record with full details
          const { error: insertError } = await supabase
            .from("providers")
            .insert({
              id: user.id,
              account_type: params.account_type,
              business_name: params.business_name,
              specialties: [params.role],
              verified: false,
              subscription_plan: "basic",
              is_active: true,
            });

          if (insertError) throw insertError;
        }
      }

      Alert.alert("Success", "Payment confirmed and provider account created!");
      router.replace("/(provider-tabs)/Home");
    } catch (err: any) {
      console.error("Error during payment:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <Text className="text-xl font-semibold mb-6 text-center">
        Pay ₦1,000 to activate your provider account
      </Text>

      {/* Location Button */}
      <TouchableOpacity
        className="bg-gray-700 rounded-lg p-3 mb-4 w-full"
        onPress={handleGetLocation}
      >
        <Text className="text-white text-center">
          {location
            ? `📍 Location set: ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`
            : "Set My Location"}
        </Text>
      </TouchableOpacity>

      {/* Payment Button */}
      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <TouchableOpacity
          onPress={handleFakePayment}
          className="bg-green-500 px-6 py-3 rounded-lg w-full"
          disabled={!location}
        >
          <Text className="text-white text-lg text-center">
            {location ? "Simulate Payment" : "Set Location First"}
          </Text>
        </TouchableOpacity>
      )}

      <Text className="mt-4 text-gray-500 text-sm text-center">
        Location:{" "}
        {location
          ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
          : "Not set"}
      </Text>
    </View>
  );
}
