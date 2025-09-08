import React from "react";
import { ImageBackground, ScrollView, Text } from "react-native";

const ChooseType = () => {
  return (
    <ImageBackground
      source={require("@/assets/images/bigBackground.png")}
      className="h-[100vh] w-full px-[30px] py-[50px]"
    >
      <ScrollView>
        <Text>Choose your account type</Text>
      </ScrollView>
    </ImageBackground>
  );
};

export default ChooseType;
