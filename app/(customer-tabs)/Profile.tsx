import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Profile = () => {
  const router = useRouter();
  const { user, fullName, updateFullName, logout } = useAuth();
  const [editedName, setEditedName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  //
  useEffect(() => {
    console.log("👤 Full Name from context:", fullName);
    console.log("👤 User ID:", user?.id);
    setEditedName(fullName);
  }, [fullName]);

  useEffect(() => {
    const checkDatabase = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        console.log("📊 Database full_name:", data?.full_name);
        console.log("📊 Database error:", error);
      }
    };
    checkDatabase();
  }, [user]);

  // Update editedName when fullName from context changes
  useEffect(() => {
    setEditedName(fullName);
  }, [fullName]);

  const handleSave = async () => {
    if (!editedName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editedName.trim() })
      .eq("id", user?.id);

    setSaving(false);
    if (error) {
      Alert.alert("Error", "Failed to update profile");
    } else {
      updateFullName(editedName.trim());
      Alert.alert("Success", "Profile updated!");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(fullName);
    setIsEditing(false);
  };

  return (
    <ImageBackground
      source={require("@/assets/images/tress-bg.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="mt-[50px] py-[15px] flex flex-row items-center relative w-full">
        {/* Page name and return button */}
        <TouchableOpacity onPress={() => router.back()} className="ml-[30px]">
          <FontAwesome6 name="arrow-left" size={30} color="white" />
        </TouchableOpacity>

        <View className="absolute left-1/2 translate-x-[-50%]">
          <Text className="text-white text-[25px] font-semibold">Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
        }}
        className="px-[30px] py-[30px]"
      >
        {/* Image Holder */}
        <View className="relative h-[150px] w-[150px] border-[1px] border-white rounded-full overflow-hidden mb-5">
          <Image
            source={require("@/assets/images/girl.png")}
            alt="avatar"
            className="absolute w-full h-full"
          />
        </View>

        {/* Name - Editable */}
        {isEditing ? (
          <View className="w-full mb-5">
            <TextInput
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your full name"
              className="bg-white rounded-lg px-4 py-3 text-lg text-center"
              placeholderTextColor="#999"
            />
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 bg-gray-300 rounded-lg py-3 items-center"
                disabled={saving}
              >
                <Text className="text-gray-800 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mb-5 flex flex-col items-center justify-center">
            <View className="flex-row items-center gap-2 justify-center">
              <Text className="text-[30px] font-semibold text-white text-center">
                {fullName || "User"}
              </Text>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <FontAwesome6 name="pen" size={18} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-[20px] font-semibold text-[#aaa] text-center">
              0 bookings, 0 reviews
            </Text>
          </View>
        )}

        {/* Email */}
        <View className="w-full mb-5 bg-white/10 rounded-lg p-4">
          <Text className="text-white text-sm mb-1">Email</Text>
          <Text className="text-white text-lg">{user?.email}</Text>
        </View>

        {/* Account Section */}
        <View className="border border-white w-full rounded-lg p-2 mb-[50px]">
          <Text className="text-[20px] text-white mb-3 font-semibold">
            Account
          </Text>

          {/* My bookings */}
          <TouchableOpacity
            className="py-3 flex flex-row gap-2 items-center"
            onPress={() => router.push("/(customer-tabs)/Bookings")}
          >
            <View className=" profileIcon">
              <FontAwesome6 name="calendar-check" color="white" size={20} />
            </View>
            <Text className="text-white text-[18px]">My Bookings</Text>
          </TouchableOpacity>

          {/* Favorite Barbers */}
          <TouchableOpacity
            className="py-3 flex flex-row gap-2 items-center"
            onPress={() => router.push("/(customer-tabs)/Favorites")}
          >
            <View className="profileIcon">
              <FontAwesome6 name="bookmark" color="white" size={20} />
            </View>
            <Text className="text-white text-[18px]">Favorite Barbers</Text>
          </TouchableOpacity>

          {/* Payment Methods */}
          <TouchableOpacity className="py-3 flex flex-row gap-2 items-center">
            <View className="profileIcon">
              <FontAwesome6 name="credit-card" color="white" size={20} />
            </View>
            <Text className="text-white text-[18px]">Payment Methods</Text>
          </TouchableOpacity>

          {/* Favorite Barbers */}
          <TouchableOpacity
            className="py-3 flex flex-row gap-2 items-center"
            onPress={() => router.push("/(customer-tabs)/Favorites")}
          >
            <View className="profileIcon">
              <FontAwesome6 name="circle-info" color="white" size={20} />
            </View>
            <Text className="text-white text-[18px]">Help & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          className="bg-[#aaaaaa62] w-full rounded-xl py-[10px] mb-[80px] "
          onPress={() => logout()}
        >
          <Text className="text-center text-white text-[20px] font-bold">
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

export default Profile;
