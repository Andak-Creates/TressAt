import { useAuth } from "@/context/AuthContext";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const index = () => {
  const { setRole } = useAuth();
  const router = useRouter();

  const handleSelect = (role: "customer" | "provider") => {
    setRole(role);
    console.log("✅ User selected:", role);

    // Navigate
    if (role === "customer") {
      router.push("/(customer)/Intro");
    } else if (role === "provider") {
      router.push("/(provider)/ChooseType");
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bigBackground.png")}
      className="border w-full h-full overflow-hidden"
    >
      <ScrollView
        className="h-full w-full flex-1 px-[30px] py-[100px] md:py-[80px] text-white"
        contentContainerStyle={{ alignItems: "center" }}
      >
        <View className=" h-[150px] w-[200px] md:w-[300px] md:h-[200px]  justify-center items-center">
          <Image
            source={require("@/assets/images/tressatLogo.png")}
            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          />
        </View>

        <Text className="text-white text-center text-[30px] font-semibold">
          Join Our Community
        </Text>
        <Text className=" text-center mt-[10px] defaultText font-extralight">
          Select your role to get started on your beauty journey.
        </Text>

        {/* Role Cards */}
        {/* Customer */}
        <TouchableOpacity
          onPress={() => handleSelect("customer")}
          className="py-[20px] w-full md:w-[50%] px-[20px] rounded-3xl bg-white mt-[30px]"
        >
          <View className="flex flex-row justify-between items-center gap-6">
            {/* Avatar */}
            <View className="p-[20px] bg-sky-200 rounded-md">
              <FontAwesome6 name="user" size={50} solid />
            </View>

            {/* Role */}
            <View className="w-[50%]">
              <Text className="text-[20px] font-bold">Customer</Text>
              <Text>Find and book beauty services</Text>
            </View>

            {/* Icons */}
            <View>
              <FontAwesome6 name="angle-right" size={30} solid />
            </View>
          </View>
        </TouchableOpacity>

        {/* Provider */}
        <TouchableOpacity
          onPress={() => handleSelect("provider")}
          className="py-[20px] px-[20px] w-full md:w-[50%] rounded-3xl bg-white mt-[30px] overflow-hidden"
        >
          <View className="flex flex-row justify-between items-center gap-2 w-full">
            {/* Avatar */}
            <View className="p-[20px] bg-purple-200 rounded-md">
              <FontAwesome6 name="building" size={50} solid />
            </View>

            {/* Role */}
            <View className="w-[50%]">
              <Text className="text-[20px] font-bold w-fit">Provider</Text>
              <Text className="w-full">
                Offer your services and manage bookings
              </Text>
            </View>

            {/* Icons */}
            <View>
              <FontAwesome6 name="angle-right" size={30} solid />
            </View>
          </View>
        </TouchableOpacity>

        <View className="mt-[50px]">
          <Text className="text-white text-[14px] text-center">
            By continuing, you agree to our{" "}
            <Text className="text-sky-400 cursor-pointer">
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text className="text-sky-400 cursor-pointer">Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default index;
