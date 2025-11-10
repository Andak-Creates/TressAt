import OverviewCard from "@/component/OverviewCard";
import HomeBookingComp from "@/component/provider-comp/HomeBookingComp";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

// Define types based on your schema
interface Customer {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
}

interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service: string;
  price: number;
  status: string;
  scheduled_at: string;
  created_at: string;
  customer: Customer;
}

interface Analytics {
  totalEarnings: number;
  earningsTrend: number;
  averageRating: number;
  ratingTrend: number;
}

const Home = () => {
  const [bookings, setBookings] = useState<Booking[]>([]); // ✅ Fixed: Added type
  const [analytics, setAnalytics] = useState<Analytics>({
    totalEarnings: 0,
    earningsTrend: 0,
    averageRating: 0,
    ratingTrend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [providerName, setProviderName] = useState<string>("");
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(
    null
  );

  // Get current provider ID
  useEffect(() => {
    const getProviderId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentProviderId(user.id);

        // ✅ Fetch provider profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          setProviderName(profile.full_name);
        }
      }
    };
    getProviderId();
  }, []);

  // Fetch today's bookings
  const fetchTodaysBookings = async () => {
    if (!currentProviderId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          customer:profiles!customer_id(
            id,
            full_name,
            avatar_url,
            phone
          )
        `
        )
        .eq("provider_id", currentProviderId)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setBookings(data || []); // ✅ Now this works
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!currentProviderId) return;

    try {
      // Get total earnings from completed bookings
      const { data: completedBookings, error: earningsError } = await supabase
        .from("bookings")
        .select("price")
        .eq("provider_id", currentProviderId)
        .eq("status", "completed");

      if (earningsError) throw earningsError;

      const totalEarnings =
        completedBookings?.reduce(
          (sum, booking) => sum + (Number(booking.price) || 0),
          0
        ) || 0;

      // Get average rating from reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", currentProviderId);

      if (reviewsError) throw reviewsError;

      const averageRating = reviews?.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

      setAnalytics({
        totalEarnings,
        earningsTrend: 15,
        averageRating: Number(averageRating.toFixed(1)),
        ratingTrend: 5,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Load all data
  useEffect(() => {
    if (currentProviderId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchTodaysBookings(), fetchAnalytics()]);
        setLoading(false);
      };
      loadData();
    }
  }, [currentProviderId]);

  // Set up real-time subscription for bookings
  useEffect(() => {
    if (!currentProviderId) return;

    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `provider_id=eq.${currentProviderId}`,
        },
        () => {
          fetchTodaysBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProviderId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#e4e4e4]">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-gray-600">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="pt-[20px] bg-[#e4e4e4]">
      <View className="py-[30px] relative">
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
