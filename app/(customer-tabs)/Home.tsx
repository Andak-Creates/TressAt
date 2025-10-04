import { supabase } from "@/lib/supabase";
import * as Location from "expo-location";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

type Provider = {
  id: string;
  business_name: string;
  location: { lat: number; lng: number };
};

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Get user's current location on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  // Fetch nearby providers (using RPC function in Supabase)
  const fetchProviders = async (lat: number, lng: number) => {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_nearby_providers", {
      lat,
      lng,
    });

    if (error) {
      console.error("Error fetching providers:", error);
    } else {
      const parsed = data.map((p: any) => ({
        ...p,
        location: {
          lat: p.location.coordinates[1],
          lng: p.location.coordinates[0],
        },
      }));
      setProviders(parsed);
    }
    setLoading(false);
  };

  // Refetch providers whenever location changes
  useEffect(() => {
    if (location) {
      fetchProviders(location.lat, location.lng);
    }
  }, [location]);

  // Handle location search
  const handleSearch = async () => {
    if (!search.trim()) return;

    try {
      const results = await Location.geocodeAsync(search);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setLocation({ lat: latitude, lng: longitude });
      } else {
        console.log("No results for that search term.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  if (!location) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Getting your location...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("@/assets/images/tress-bg.png")}
      resizeMode="cover"
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Map */}
            <View
              className="h-[500px] rounded-lg overflow-hidden"
              pointerEvents="box-none"
            >
              {/* Search bar - positioned above map */}
              <View className="absolute top-12 left-1/2 translate-x-[-50%] w-[300px] z-20 bg-white rounded-lg shadow px-3 py-2 flex-row justify-center items-center">
                <TextInput
                  placeholder="Search a location..."
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={handleSearch}
                  className="flex-1 text-base"
                />
                <TouchableOpacity onPress={handleSearch}>
                  <Text className="text-blue-500 font-semibold">Go</Text>
                </TouchableOpacity>
              </View>

              <MapView
                style={{ flex: 1 }}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {providers.map((p) => (
                  <Marker
                    key={p.id}
                    coordinate={{
                      latitude: p.location.lat,
                      longitude: p.location.lng,
                    }}
                    title={p.business_name}
                    pinColor="red"
                  />
                ))}
              </MapView>
            </View>

            {/* Provider list */}
            <View className="flex-1 bg-white px-4 pt-4">
              <Text className="text-xl font-bold mb-4">Providers</Text>

              {loading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text className="mt-2 text-gray-500">
                    Loading providers...
                  </Text>
                </View>
              ) : providers.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-gray-500 text-center text-base">
                    No providers found
                  </Text>
                  <Text className="text-gray-400 text-center text-sm mt-2">
                    Try searching another location
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={providers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity className="p-4 mb-3 rounded-xl bg-gray-50 border border-gray-200">
                      <Text className="font-bold text-base mb-1">
                        {item.business_name}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        📍 {item.location.lat.toFixed(4)},{" "}
                        {item.location.lng.toFixed(4)}
                      </Text>
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
