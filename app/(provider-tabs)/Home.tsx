// Home.tsx
import OverviewCard from "@/component/OverviewCard";
import HomeBookingComp from "@/component/provider-comp/HomeBookingComp";
import { useProviderStore } from "@/lib/store/useProviderStore";
import { supabase } from "@/lib/supabase";
import React, { useEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const Home = () => {
  const {
    providerName,
    bookings,
    analytics,
    loading,
    setProviderId,
    loadDashboardData,
    subscribeToBookings,
  } = useProviderStore();

  // Initialize provider ID on mount
  useEffect(() => {
    const initProvider = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProviderId(user.id);
      }
    };
    initProvider();
  }, []);

  // Load dashboard data when provider ID is set
  useEffect(() => {
    const providerId = useProviderStore.getState().currentProviderId;
    if (providerId) {
      loadDashboardData();
    }
  }, [useProviderStore.getState().currentProviderId]);

  // Set up real-time subscription
  useEffect(() => {
    const cleanup = subscribeToBookings();
    return cleanup;
  }, [useProviderStore.getState().currentProviderId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#e4e4e4]">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-gray-600">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View>
      <View className="pt-[50px] pb-[30px] relative bg-[#e4e4e4]">
        <Text className="text-center text-[18px] font-semibold">Dashboard</Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          alignItems: "flex-start",
          justifyContent: "flex-end",
        }}
        className="h-screen w-full px-[20px] py-[30px]"
      >
        {/* Provider name */}
        <Text className="text-lg font-bold mb-4 text-gray-800">
          Welcome back, {providerName || "Provider"} 👋
        </Text>

        {/* Analytics */}
        <View className="flex-row flex-wrap justify-between text-gray-900 gap-y-[20px]">
          <OverviewCard
            name="Earnings"
            value={analytics.totalEarnings.toLocaleString()}
            trend={analytics.earningsTrend}
            naira={true}
          />
        </View>

        {/* Today's Bookings */}
        <View className="w-full my-[30px]">
          <Text className="font-bold text-[20px] my-4">
            Today's Bookings ({bookings.length})
          </Text>

          {/* Bookings Cards */}
          <View className="w-full gap-y-5">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <HomeBookingComp key={booking.id} booking={booking} />
              ))
            ) : (
              <View className="bg-white p-6 rounded-xl items-center">
                <Text className="text-gray-500">No bookings for today</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
