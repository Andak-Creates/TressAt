import { useAuth } from "@/context/AuthContext";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const Home = () => {
  const { logout } = useAuth();
  return (
    <View className="h-screen w-full flex justify-center items-center">
      <Text>Provider index</Text>
      {/* Log Out */}
      <TouchableOpacity
        className="bg-[#aaaaaa62] w-full rounded-xl py-[10px] mb-[80px] "
        onPress={() => logout()}
      >
        <Text className="text-center text-white text-[20px] font-bold">
          Log Out
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;
