// Bookings.tsx (Provider Side)
import { useProviderStore } from "@/lib/store/useProviderStore";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BookingItem {
  id: string;
  service_name: string;
  service_price: number;
  person_number: number;
}

interface Booking {
  id: string;
  customer_id: string;
  scheduled_at: string;
  status: string;
  number_of_people: number;
  total_price: number;
  created_at: string;
  customer: {
    full_name: string;
    phone: string;
    avatar_url?: string;
  };
  booking_items: BookingItem[];
}

const Bookings = () => {
  const { currentProviderId, setProviderId } = useProviderStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const statuses = [
    { key: "all", label: "All", color: "bg-gray-500" },
    { key: "pending", label: "Pending", color: "bg-yellow-500" },
    { key: "confirmed", label: "Confirmed", color: "bg-blue-500" },
    { key: "in_progress", label: "In Progress", color: "bg-purple-500" },
    { key: "completed", label: "Completed", color: "bg-green-500" },
    { key: "cancelled", label: "Cancelled", color: "bg-red-500" },
  ];

  // Initialize provider ID
  useEffect(() => {
    const initProvider = async () => {
      if (!currentProviderId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setProviderId(user.id);
        }
      }
    };
    initProvider();
  }, []);

  // Fetch bookings
  const fetchBookings = async () => {
    if (!currentProviderId) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          customer:profiles!customer_id(
            full_name,
            phone,
            avatar_url
          ),
          booking_items(
            id,
            service_name,
            service_price,
            person_number
          )
        `
        )
        .eq("provider_id", currentProviderId)
        .order("scheduled_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      filterBookings(data || [], selectedStatus);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter bookings by status
  const filterBookings = (bookingsList: Booking[], status: string) => {
    if (status === "all") {
      setFilteredBookings(bookingsList);
    } else {
      setFilteredBookings(
        bookingsList.filter((booking) => booking.status === status)
      );
    }
  };

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    filterBookings(bookings, status);
  };

  // Load bookings when provider ID is available
  useEffect(() => {
    if (currentProviderId) {
      fetchBookings();
    }
  }, [currentProviderId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentProviderId) return;

    const channel = supabase
      .channel("provider-bookings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `provider_id=eq.${currentProviderId}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProviderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      Alert.alert("Success", `Booking ${newStatus}`);
      fetchBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Handle booking actions
  const handleAccept = (bookingId: string) => {
    Alert.alert("Accept Booking", "Confirm this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => updateBookingStatus(bookingId, "confirmed"),
      },
    ]);
  };

  const handleDecline = (bookingId: string) => {
    Alert.alert("Decline Booking", "Are you sure you want to decline?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => updateBookingStatus(bookingId, "cancelled"),
      },
    ]);
  };

  const handleStartService = (bookingId: string) => {
    updateBookingStatus(bookingId, "in_progress");
  };

  const handleComplete = (bookingId: string) => {
    Alert.alert("Complete Booking", "Mark this booking as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () => updateBookingStatus(bookingId, "completed"),
      },
    ]);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusObj = statuses.find((s) => s.key === status);
    return statusObj?.color || "bg-gray-500";
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#e4e4e4]">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-gray-600">Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f5f5f5]">
      {/* Header */}
      <View className="bg-white pt-[50px] pb-4 px-5 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Bookings</Text>
        <Text className="text-gray-500 mt-1">
          {filteredBookings.length}{" "}
          {selectedStatus === "all" ? "total" : selectedStatus}
        </Text>
      </View>

      {/* Status Filter */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          {statuses.map((status) => (
            <TouchableOpacity
              key={status.key}
              onPress={() => handleStatusChange(status.key)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedStatus === status.key ? status.color : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-semibold ${
                  selectedStatus === status.key ? "text-white" : "text-gray-600"
                }`}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bookings List */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBookings.length > 0 ? (
          <View className="p-5 gap-4">
            {filteredBookings.map((booking) => (
              <View
                key={booking.id}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                {/* Customer Info */}
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-full bg-green-500 items-center justify-center mr-3">
                    <Text className="text-white text-lg font-bold">
                      {booking.customer.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {booking.customer.full_name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {booking.customer.phone}
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    <Text className="text-white text-xs font-semibold">
                      {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Date & Time */}
                <View className="bg-gray-50 p-3 rounded-lg mb-3">
                  <Text className="text-gray-600 text-sm font-semibold mb-1">
                    📅 {formatDate(booking.scheduled_at)}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    👥 {booking.number_of_people}{" "}
                    {booking.number_of_people > 1 ? "people" : "person"}
                  </Text>
                </View>

                {/* Services */}
                <View className="mb-3">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Services:
                  </Text>
                  {booking.booking_items && booking.booking_items.length > 0 ? (
                    booking.booking_items.map((item, index) => (
                      <View
                        key={item.id}
                        className="flex-row justify-between py-1"
                      >
                        <Text className="text-gray-600 text-sm">
                          Person {item.person_number}: {item.service_name}
                        </Text>
                        <Text className="text-gray-800 font-semibold text-sm">
                          ₦{item.service_price.toLocaleString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-gray-500 text-sm">
                      No services listed
                    </Text>
                  )}
                </View>

                {/* Total Price */}
                <View className="border-t border-gray-200 pt-3 mb-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-700 font-bold">Total:</Text>
                    <Text className="text-green-600 font-bold text-lg">
                      ₦{booking.total_price.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                {booking.status === "pending" && (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => handleDecline(booking.id)}
                      className="flex-1 bg-red-500 py-3 rounded-lg"
                    >
                      <Text className="text-white text-center font-semibold">
                        Decline
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleAccept(booking.id)}
                      className="flex-1 bg-green-500 py-3 rounded-lg"
                    >
                      <Text className="text-white text-center font-semibold">
                        Accept
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {booking.status === "confirmed" && (
                  <TouchableOpacity
                    onPress={() => handleStartService(booking.id)}
                    className="bg-blue-500 py-3 rounded-lg"
                  >
                    <Text className="text-white text-center font-semibold">
                      Start Service
                    </Text>
                  </TouchableOpacity>
                )}

                {booking.status === "in_progress" && (
                  <TouchableOpacity
                    onPress={() => handleComplete(booking.id)}
                    className="bg-green-500 py-3 rounded-lg"
                  >
                    <Text className="text-white text-center font-semibold">
                      Mark as Completed
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-lg">
              No {selectedStatus === "all" ? "" : selectedStatus} bookings
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Bookings;
