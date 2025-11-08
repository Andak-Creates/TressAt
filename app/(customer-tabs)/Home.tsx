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
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

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
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const costPerKm = 200; // ₦200 per km example

  // Get user's current location
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

  // Fetch nearby providers
  const fetchProviders = async (lat: number, lng: number) => {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_nearby_providers", {
      lat,
      lng,
    });

    if (error) {
      console.error("Error fetching providers:", error);
      setProviders([]); // prevent undefined crash
      setLoading(false);
      return;
    }

    // Defensive checks to prevent undefined issues
    if (!data || !Array.isArray(data)) {
      console.warn("No valid data returned from get_nearby_providers:", data);
      setProviders([]);
      setLoading(false);
      return;
    }

    const parsed = data.map((p: any) => ({
      ...p,
      location: {
        lat: p?.location?.coordinates?.[1] ?? 0,
        lng: p?.location?.coordinates?.[0] ?? 0,
      },
    }));

    setProviders(parsed);
    setLoading(false);
  };
  // Refetch when location changes
  useEffect(() => {
    if (location) {
      fetchProviders(location.lat, location.lng);
    }
  }, [location]);

  // Fallback manual geocoding (if Google fails)
  const handleManualSearch = async (text: string) => {
    try {
      const results = await Location.geocodeAsync(text);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setLocation({ lat: latitude, lng: longitude });
        setSelectedProvider(null);
        setDistance(null);
        setDuration(null);
      } else {
        console.log("No results found for fallback search.");
      }
    } catch (err) {
      console.error("Fallback geocoding error:", err);
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

  const estimatedFare = distance ? distance * costPerKm : null;

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
            {/* Map Section */}
            <View
              className="h-[500px] rounded-lg overflow-hidden"
              pointerEvents="box-none"
            >
              {/* Search Box */}
              {!useFallback ? (
                <View className="absolute top-12 w-[90%] self-center z-20">
                  <GooglePlacesAutocomplete
                    placeholder="Search for a place..."
                    fetchDetails={true}
                    onFail={(err) => {
                      console.log("Google Places error:", err);
                      setUseFallback(true);
                    }}
                    onPress={(data, details = null) => {
                      console.log(data, details);
                      if (details) {
                        const { lat, lng } = details.geometry.location;
                        setLocation({ lat, lng });
                        setSelectedProvider(null);
                        setDistance(null);
                        setDuration(null);
                      }
                    }}
                    query={{
                      key: GOOGLE_API_KEY,
                      language: "en",
                    }}
                    styles={{
                      textInput: {
                        backgroundColor: "#fff",
                        borderRadius: 8,
                        fontSize: 16,
                        paddingHorizontal: 10,
                        height: 44,
                      },
                      container: { flex: 0 },
                      listView: { backgroundColor: "white" },
                    }}
                  />
                </View>
              ) : (
                // Fallback simple input
                <View className="absolute top-12 w-[90%] self-center z-20 bg-white p-2 rounded-lg flex-row justify-between items-center shadow">
                  <Text className="text-gray-700 flex-1">
                    Fallback search (Google offline)
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleManualSearch("Lagos, Nigeria")}
                    className="bg-blue-500 rounded-md px-3 py-1"
                  >
                    <Text className="text-white">Try Lagos</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Map */}
              <MapView
                style={{ flex: 1 }}
                region={{
                  latitude: location.lat,
                  longitude: location.lng,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation
                showsMyLocationButton
              >
                {providers.map((p) => (
                  <Marker
                    key={p.id}
                    coordinate={{
                      latitude: p.location.lat,
                      longitude: p.location.lng,
                    }}
                    title={p.business_name}
                    pinColor={selectedProvider?.id === p.id ? "blue" : "red"}
                    onPress={() => {
                      setSelectedProvider(p);
                      setDistance(null);
                      setDuration(null);
                    }}
                  />
                ))}

                {selectedProvider && (
                  <MapViewDirections
                    origin={{
                      latitude: location.lat,
                      longitude: location.lng,
                    }}
                    destination={{
                      latitude: selectedProvider.location.lat,
                      longitude: selectedProvider.location.lng,
                    }}
                    apikey={GOOGLE_API_KEY}
                    strokeWidth={4}
                    strokeColor="blue"
                    onError={(err) =>
                      console.log("Directions error:", err.message)
                    }
                    onReady={(result) => {
                      setDistance(result.distance);
                      setDuration(result.duration);
                    }}
                  />
                )}
              </MapView>

              {/* Fare Card */}
              {selectedProvider && distance && (
                <View className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white px-5 py-3 rounded-2xl shadow-lg w-[90%]">
                  <Text className="text-lg font-semibold text-gray-800 text-center mb-2">
                    {selectedProvider.business_name}
                  </Text>
                  <Text className="text-gray-600 text-center">
                    Distance: {distance.toFixed(2)} km
                  </Text>
                  <Text className="text-gray-600 text-center">
                    Duration: {duration?.toFixed(0)} mins
                  </Text>
                  <Text className="text-blue-600 font-bold text-center mt-2">
                    Estimated Fare: ₦{estimatedFare?.toFixed(0)}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedProvider.location.lat},${selectedProvider.location.lng}`
                      )
                    }
                    className="mt-3 bg-blue-500 rounded-lg py-2"
                  >
                    <Text className="text-white font-bold text-center">
                      Get Directions
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Provider List */}
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
                    <TouchableOpacity
                      onPress={() => setSelectedProvider(item)}
                      className={`p-4 mb-3 rounded-xl border ${
                        selectedProvider?.id === item.id
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
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
