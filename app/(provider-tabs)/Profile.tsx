import { useProviderStore } from "@/lib/store/useProviderStore";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = width - 40;

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

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Service Modal State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");

  // Loading States
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / SLIDE_WIDTH
    );
    setActiveSlide(slideIndex);
  };

  const handleEditProfile = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveProfile = () => {
    Alert.alert("Saved!", "Your profile has been updated");
    setIsEditMode(false);
  };

  // ===== PORTFOLIO FUNCTIONS =====

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square for profile picture
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfileImage(result.assets[0].uri);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    if (!currentProviderId) return;

    setUploading(true);
    try {
      // Read file as base64
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${currentProviderId}/avatar.${fileExt}`;
      const contentType = `image/${fileExt}`;

      // Upload to Supabase Storage (portfolio bucket, avatar subfolder)
      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filename, decode(base64), {
          contentType: contentType,
          upsert: true, // Replace existing avatar
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("portfolio")
        .getPublicUrl(filename);

      // Update profile in database
      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          avatar_url: urlData.publicUrl,
        })
        .eq("id", currentProviderId);

      if (dbError) throw dbError;

      Alert.alert("Success!", "Profile picture updated");
      loadProfileData();
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photos to upload portfolio images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPortfolioImage(result.assets[0].uri);
    }
  };

  const uploadPortfolioImage = async (uri: string) => {
    if (!currentProviderId) return;

    setUploading(true);
    try {
      // Debug: Check provider ID
      console.log("Current Provider ID:", currentProviderId);

      // Verify user is authenticated and matches provider
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Auth User ID:", user?.id);

      if (!user) {
        throw new Error("Not authenticated");
      }

      if (user.id !== currentProviderId) {
        throw new Error(
          `User ID mismatch: ${user.id} !== ${currentProviderId}`
        );
      }

      // Read file as base64
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${currentProviderId}/${Date.now()}.${fileExt}`;
      const contentType = `image/${fileExt}`;

      console.log("Uploading to:", filename);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filename, decode(base64), {
          contentType: contentType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      console.log("Upload successful, getting public URL...");

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("portfolio")
        .getPublicUrl(filename);

      console.log("Public URL:", urlData.publicUrl);
      console.log(
        "Inserting into portfolios table with provider_id:",
        currentProviderId
      );

      // Save to database
      const { error: dbError } = await supabase.from("portfolios").insert({
        provider_id: currentProviderId,
        image_url: urlData.publicUrl,
      });

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      Alert.alert("Success!", "Portfolio image uploaded");
      loadProfileData();
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Helper function to decode base64
  const decode = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const deletePortfolioImage = async (imageUrl: string) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("portfolios")
              .delete()
              .eq("provider_id", currentProviderId)
              .eq("image_url", imageUrl);

            if (error) throw error;

            Alert.alert("Deleted", "Image removed from portfolio");
            loadProfileData();
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  // ===== SERVICE FUNCTIONS =====

  const openServiceModal = (service?: any) => {
    if (service) {
      setEditingService(service);
      setServiceName(service.name);
      setServicePrice(service.price.toString());
      setServiceDuration(service.duration.toString());
      setServiceDescription(service.description || "");
    } else {
      setEditingService(null);
      setServiceName("");
      setServicePrice("");
      setServiceDuration("");
      setServiceDescription("");
    }
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setEditingService(null);
    setServiceName("");
    setServicePrice("");
    setServiceDuration("");
    setServiceDescription("");
  };

  const saveService = async () => {
    if (!serviceName || !servicePrice || !serviceDuration) {
      Alert.alert("Missing Info", "Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        provider_id: currentProviderId,
        name: serviceName,
        price: parseFloat(servicePrice),
        duration: parseInt(serviceDuration),
        description: serviceDescription,
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        Alert.alert("Updated!", "Service updated successfully");
      } else {
        const { error } = await supabase.from("services").insert(serviceData);

        if (error) throw error;
        Alert.alert("Added!", "New service added successfully");
      }

      closeServiceModal();
      loadProfileData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("services")
                .delete()
                .eq("id", serviceId);

              if (error) throw error;
              Alert.alert("Deleted", "Service removed");
              loadProfileData();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const toggleServiceStatus = async (
    serviceId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ is_active: !currentStatus })
        .eq("id", serviceId);

      if (error) throw error;
      loadProfileData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
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

      <ScrollView className="flex-1 bg-[#f5f5f5]">
        {/* Profile Header */}
        <View className="bg-white px-[20px] py-[30px] items-center">
          <TouchableOpacity
            onPress={isEditMode ? pickProfileImage : undefined}
            disabled={uploading}
            className="relative"
          >
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
            {isEditMode && (
              <View className="absolute bottom-3 right-0 bg-green-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white">
                <Text className="text-white text-lg font-bold">+</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">
            {providerName || "Provider"}
          </Text>

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

          {/* Edit/Save Buttons */}
          {!isEditMode ? (
            <TouchableOpacity
              onPress={handleEditProfile}
              className="mt-6 bg-green-500 px-8 py-3 rounded-full"
            >
              <Text className="text-white font-semibold text-base">
                Edit Profile
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={handleCancelEdit}
                className="bg-gray-300 px-6 py-3 rounded-full"
              >
                <Text className="text-gray-700 font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                className="bg-green-500 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold text-base">Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Portfolio Section */}
        <View className="mt-6 bg-white py-6 rounded-xl">
          <View className="flex-row justify-between items-center px-[20px] mb-4">
            <Text className="text-xl font-bold">Portfolio</Text>
            {isEditMode && (
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploading}
                className="bg-green-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold text-sm">
                  {uploading ? "Uploading..." : "+ Add"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {portfolioImages.length > 0 ? (
            <>
              {isEditMode ? (
                // Edit Mode: Grid with delete buttons
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {portfolioImages.map((image, index) => (
                    <View key={index} className="mr-3 relative">
                      <Image
                        source={{ uri: image }}
                        className="w-32 h-32 rounded-lg"
                      />
                      <TouchableOpacity
                        onPress={() => deletePortfolioImage(image)}
                        className="absolute top-2 right-2 bg-red-500 w-7 h-7 rounded-full items-center justify-center"
                      >
                        <Text className="text-white font-bold text-lg">×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                // View Mode: Slideshow
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
                    getItemLayout={(data, index) => ({
                      length: SLIDE_WIDTH,
                      offset: SLIDE_WIDTH * index,
                      index,
                    })}
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
              )}
            </>
          ) : (
            <View className="px-[20px]">
              <View className="bg-gray-100 h-64 rounded-xl items-center justify-center">
                <Text className="text-gray-400">No portfolio images yet</Text>
                {isEditMode && (
                  <Text className="text-gray-400 text-sm mt-1">
                    Tap "+ Add" to upload
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Services Section */}
        <View className="mt-6 bg-white py-6 mb-6 rounded-xl">
          <View className="flex-row justify-between items-center px-[20px] mb-4">
            <Text className="text-xl font-bold">Services</Text>
            {isEditMode && (
              <TouchableOpacity
                onPress={() => openServiceModal()}
                className="bg-green-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold text-sm">+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {services.length > 0 ? (
            <View className="px-[20px] gap-4">
              {services.map((service) => (
                <View
                  key={service.id}
                  className={`p-4 rounded-xl border ${
                    service.is_active
                      ? "bg-gray-50 border-gray-200"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text
                      className={`text-lg font-semibold flex-1 ${
                        service.is_active ? "text-gray-800" : "text-gray-400"
                      }`}
                    >
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

                  {/* Edit Mode Actions */}
                  {isEditMode && (
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        onPress={() => openServiceModal(service)}
                        className="flex-1 bg-blue-500 py-2 rounded-lg"
                      >
                        <Text className="text-white text-center font-semibold text-sm">
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          toggleServiceStatus(service.id, service.is_active)
                        }
                        className={`flex-1 py-2 rounded-lg ${
                          service.is_active ? "bg-orange-500" : "bg-green-500"
                        }`}
                      >
                        <Text className="text-white text-center font-semibold text-sm">
                          {service.is_active ? "Hide" : "Show"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteService(service.id)}
                        className="bg-red-500 px-3 py-2 rounded-lg"
                      >
                        <Text className="text-white font-semibold text-sm">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="px-[20px]">
              <View className="bg-gray-100 p-6 rounded-xl items-center">
                <Text className="text-gray-400">No services added yet</Text>
                {isEditMode && (
                  <Text className="text-gray-400 text-sm mt-1">
                    Tap "+ Add" to create one
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <Text className="text-2xl font-bold mb-6">
              {editingService ? "Edit Service" : "Add New Service"}
            </Text>

            <ScrollView>
              <View className="gap-4">
                <View>
                  <Text className="text-gray-700 mb-2 font-semibold">
                    Service Name *
                  </Text>
                  <TextInput
                    value={serviceName}
                    onChangeText={setServiceName}
                    placeholder="e.g., Beard Trim"
                    className="border border-gray-300 rounded-lg p-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-semibold">
                    Price (₦) *
                  </Text>
                  <TextInput
                    value={servicePrice}
                    onChangeText={setServicePrice}
                    placeholder="e.g., 500"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg p-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-semibold">
                    Duration (minutes) *
                  </Text>
                  <TextInput
                    value={serviceDuration}
                    onChangeText={setServiceDuration}
                    placeholder="e.g., 30"
                    keyboardType="numeric"
                    className="border border-gray-300 rounded-lg p-3 text-base"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 mb-2 font-semibold">
                    Description (Optional)
                  </Text>
                  <TextInput
                    value={serviceDescription}
                    onChangeText={setServiceDescription}
                    placeholder="Describe your service..."
                    multiline
                    numberOfLines={3}
                    className="border border-gray-300 rounded-lg p-3 text-base"
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={closeServiceModal}
                  className="flex-1 bg-gray-200 py-4 rounded-lg"
                >
                  <Text className="text-gray-700 text-center font-semibold text-base">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveService}
                  disabled={saving}
                  className="flex-1 bg-green-500 py-4 rounded-lg"
                >
                  <Text className="text-white text-center font-semibold text-base">
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;
