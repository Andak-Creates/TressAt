import { useProviderStore } from "@/lib/store/useProviderStore";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = width - 40; // Account for padding

const Profile = () => {
  const {
    providerName,
    currentProviderId,
    profile,
    portfolioImages,
    services,
    analytics,
    loading,
    setProviderId,
    loadProfileData,
  } = useProviderStore();

  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Initialize provider ID if not already set
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

  // Fetch profile data when provider ID is available
  useEffect(() => {
    if (currentProviderId) {
      loadProfileData();
    }
  }, [currentProviderId]);

  // Auto-scroll slideshow
  useEffect(() => {
    if (portfolioImages.length > 1) {
      const interval = setInterval(() => {
        setActiveSlide((prev) => {
          const nextSlide = (prev + 1) % portfolioImages.length;
          flatListRef.current?.scrollToIndex({
            index: nextSlide,
            animated: true,
          });
          return nextSlide;
        });
      }, 3000); // Change slide every 3 seconds

      return () => clearInterval(interval);
    }
  }, [portfolioImages.length]);

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / SLIDE_WIDTH
    );
    setActiveSlide(slideIndex);
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    console.log("Edit profile");
    // You can use navigation here: navigation.navigate('EditProfile')
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#e4e4e4]">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="pt-[50px] pb-[30px] relative bg-[#e4e4e4]">
        <Text className="text-center text-[18px] font-semibold">Profile</Text>
      </View>

      <ScrollView className="flex-1 bg-[#f5f5f5] px-[20px]">
        {/* Profile Header */}
        <View className="px-[20px] py-[30px] items-center">
          <View className="w-24 h-24 rounded-full bg-green-500 items-center justify-center mb-4">
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <Text className="text-white text-3xl font-bold">
                {providerName ? providerName.charAt(0).toUpperCase() : "?"}
              </Text>
            )}
          </View>
          <Text className="text-2xl font-bold text-gray-800">
            {providerName || "Provider"}
          </Text>
          {profile?.bio && (
            <Text className="text-gray-500 mt-2 text-center">
              {profile.bio}
            </Text>
          )}

          {/* Stats */}
          <View className="flex-row gap-8 mt-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">
                ₦{analytics.totalEarnings.toLocaleString()}
              </Text>
              <Text className="text-gray-500 text-sm">Total Earnings</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-yellow-500">
                {analytics.averageRating > 0
                  ? `${analytics.averageRating} ⭐`
                  : "N/A"}
              </Text>
              <Text className="text-gray-500 text-sm">Rating</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-blue-600">
                {services.length}
              </Text>
              <Text className="text-gray-500 text-sm">Services</Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            onPress={handleEditProfile}
            className="mt-6 bg-green-500 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-semibold text-base">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio Section */}
        <View className="mt-6 bg-white py-6 rounded-xl">
          <Text className="text-xl font-bold px-[20px] mb-4">Portfolio</Text>

          {portfolioImages.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={portfolioImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={SLIDE_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20 }}
                keyExtractor={(item, index) => `portfolio-${index}`}
                renderItem={({ item }) => (
                  <View style={{ width: SLIDE_WIDTH }} className="pr-4">
                    <Image
                      source={{ uri: item }}
                      className="w-full h-64 rounded-xl"
                      resizeMode="cover"
                    />
                  </View>
                )}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise((resolve) =>
                    setTimeout(resolve, 500)
                  );
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                    });
                  });
                }}
              />

              {/* Pagination Dots */}
              <View className="flex-row justify-center mt-4 gap-2">
                {portfolioImages.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    className={`h-2 rounded-full ${
                      index === activeSlide
                        ? "w-8 bg-green-500"
                        : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </View>
            </>
          ) : (
            <View className="px-[20px]">
              <View className="bg-gray-100 h-64 rounded-xl items-center justify-center">
                <Text className="text-gray-400">No portfolio images yet</Text>
              </View>
            </View>
          )}
        </View>

        {/* Services Section */}
        <View className="mt-6 bg-white py-6 mb-6 rounded-xl">
          <Text className="text-xl font-bold px-[20px] mb-4">Services</Text>

          {services.length > 0 ? (
            <View className="px-[20px] gap-4">
              {services.map((service) => (
                <View
                  key={service.id}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-lg font-semibold text-gray-800 flex-1">
                      {service.name}
                    </Text>
                    <Text className="text-green-600 font-bold text-lg">
                      ₦{service.price.toLocaleString()}
                    </Text>
                  </View>
                  {service.description && (
                    <Text className="text-gray-600 text-sm mb-2">
                      {service.description}
                    </Text>
                  )}
                  <Text className="text-gray-500 text-sm">
                    Duration: {service.duration} mins
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="px-[20px]">
              <View className="bg-gray-100 p-6 rounded-xl items-center">
                <Text className="text-gray-400">No services added yet</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
