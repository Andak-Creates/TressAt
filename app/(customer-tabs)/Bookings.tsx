import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Bookings = () => {
  const router = useRouter();

  const tabs = [
    { key: "upcoming", label: "Upcoming Bookings" },
    { key: "history", label: "Previous Bookings" },
  ] as const;

  type TabKey = (typeof tabs)[number]["key"];
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");

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
          <Text className="text-white text-[25px] font-semibold">
            My Bookings
          </Text>
        </View>
      </View>

      <View
        className="mt-[10px] relative flex flex-row w-[90%] mx-auto justify-between 
      rounded-3xl bg-[#ffffff]
      items-center border border-white py-[2px] px-[2px] "
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={1}
            onPress={() => setActiveTab(tab.key)}
            className={`py-[15px] w-[50%]  rounded-3xl ${
              activeTab === tab.key ? "bg-[#080202]" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center text-[16px] ${
                activeTab === tab.key ? "text-white" : "text-black"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
        }}
        className="px-[30px] py-[30px]"
      >
        {activeTab === "upcoming" && (
          <Text className="text-white">No Upcoming Bookings yet Man</Text>
        )}
        {activeTab === "history" && (
          <Text className="text-white">No Bookings History yet man</Text>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

export default Bookings;
