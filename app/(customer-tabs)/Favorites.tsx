import React from "react";
import { ImageBackground, Text, View } from "react-native";

const Favorites = () => {
  return (
    <ImageBackground
      className="flex-1"
      source={require("@/assets/images/tress-bg.png")}
      resizeMode="cover"
    >
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Favorite Providers</Text>
      </View>
    </ImageBackground>
  );
};

export default Favorites;
