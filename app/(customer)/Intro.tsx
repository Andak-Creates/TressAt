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

const Intro = () => {
  const router = useRouter();
  return (
    <ImageBackground
      source={require("@/assets/images/bigBackground.png")}
      className="h-full w-full"
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        className="pt-[100px] px-[30px] h-[100vh]"
      >
        <View
          className="relative w-full 
        flex flex-col justify-center items-center
        mt-[30px]"
        >
          {/* Girl Image */}
          <View
            className="h-[280px] w-[100%] relative 
         overflow-hidden shadow-slate-50"
          >
            <Image
              source={require("@/assets/images/girl.png")}
              className="h-full w-full object-cover border
            rounded-xl border-white"
            />
          </View>

          <View className="mt-[20px]">
            <Text className="text-white font-bold text-[35px] text-center">
              Book With Trusted Professionals
            </Text>
            <Text className="text-white text-center mt-[10px] text-[16px]">
              Find and book appointmants with top-rated barbers, hairstylists,
              and braiders in your area
            </Text>
          </View>
        </View>

        <View className="relative w-full mt-[160px]">
          {/* Intro status */}
          <View className="relative w-auto mx-auto flex flex-row justify-center items-center gap-[10px]">
            <View className="bg-blue-500 w-[40px] h-[10px] rounded-full"></View>
            <View className="bg-blue-500 w-[10px] h-[10px] rounded-full"></View>
          </View>

          {/* Get Started */}
          <View className="w-full">
            <TouchableOpacity
              onPress={() => {
                router.push("/(customer)/SignUp");
              }}
              className="w-full 
          py-[10px] rounded-md  bg-blue-600 mt-[20px] self-end"
            >
              <Text className="text-center text-white text-[18px]">
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Intro;
