import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

// ✅ Add type definitions
interface Customer {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
}

interface BookingItem {
  id: string;
  service_name: string;
  service_price: number;
  person_number: number;
}

interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service?: string; // Old format - optional
  price?: number; // Old format - optional
  total_price?: number; // New format
  status: string;
  scheduled_at: string;
  created_at: string;
  number_of_people?: number; // New format
  customer: Customer;
  booking_items?: BookingItem[]; // New format
}

interface HomeBookingCompProps {
  booking: Booking;
}

// ✅ Accept booking as a prop
const HomeBookingComp = ({ booking }: HomeBookingCompProps) => {
  const router = useRouter();

  // Get service display text
  const getServiceDisplay = () => {
    // Check if new format with booking_items exists
    if (booking.booking_items && booking.booking_items.length > 0) {
      if (booking.booking_items.length === 1) {
        return booking.booking_items[0].service_name;
      }
      return `${booking.booking_items.length} services`;
    }
    // Fallback to old format
    return booking.service || "Service";
  };

  // Get price display
  const getPrice = () => {
    return booking.total_price || booking.price || 0;
  };

  // Format time from scheduled_at
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  // Calculate end time (assuming 1 hour duration)
  const getEndTime = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 1);
    return formatTime(date.toISOString());
  };

  return (
    <TouchableOpacity
      onPress={() => {
        requestAnimationFrame(() => {
          router.push("/(provider-tabs)/Bookings");
        });
      }}
      className="bg-white p-4 w-full rounded-xl flex flex-row justify-between items-center"
    >
      {/* Left section with avatar and booking details */}
      <View className="flex flex-row items-center gap-3 flex-1">
        {/* Avatar - show image if available, otherwise show icon */}
        {booking.customer.avatar_url ? (
          <Image
            source={{ uri: booking.customer.avatar_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
            <FontAwesome6 name="user" size={24} color="#666" />
          </View>
        )}

        {/* Booking details */}
        <View className="flex-1">
          <Text className="text-[16px] font-semibold">
            {getServiceDisplay()} with {booking.customer.full_name}
          </Text>
          <Text className="text-gray-500 text-sm">
            {formatTime(booking.scheduled_at)} -{" "}
            {getEndTime(booking.scheduled_at)}
          </Text>
          {/* Show price */}
          <Text className="text-green-600 font-semibold text-sm mt-1">
            ₦{getPrice().toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Options icon */}
      <FontAwesome6 name="ellipsis-vertical" size={18} color="#555" />
    </TouchableOpacity>
  );
};

export default HomeBookingComp;
