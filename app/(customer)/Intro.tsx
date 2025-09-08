import { Image } from "expo-image";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Intro = () => {
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
        className="py-[50px] px-[30px]"
      >
        {/* Girl Image */}
        <View className="h-[200px] w-[300px]">
          <Image
            source={"@/assets/images/girl.png"}
            className="h-full w-full object-cover border border-white"
          />
        </View>

        <View>
          <Text className="text-white font-bold text-[35px] text-center">
            Book With Trusted Professionals
          </Text>
          <Text className="text-white text-center mt-[10px]">
            Find and book appointmants with top-rated barbers, hairstylists, and
            braiders in your area
          </Text>
        </View>

        {/* Get Started */}
        <View>
          <TouchableOpacity
            className="border w-[250px] 
          py-[10px] rounded-md  bg-blue-600 mt-[20px]"
          >
            <Text className="text-center text-white">Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Intro;
