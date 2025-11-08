import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TypeScreen = () => {
  const router = useRouter();
  const { setRole } = useAuth();
  const { role, specialty } = useLocalSearchParams<{
    role?: string;
    specialty?: string;
  }>();

  console.log("role:", role);

  const handleSelect = (displayName: string) => {
    // ✅ Map display names to database values
    const account_type = displayName === "Individual" ? "freelancer" : "shop";

    // ✅ Make sure role is stored in global context
    setRole("provider");

    // ✅ Pass everything forward (role, account_type, specialty)
    router.push({
      pathname: "/(provider)/(auth)/NameScreen",
      params: {
        role: "provider",
        account_type,
        specialty,
      },
    });
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      <Text className="text-2xl font-bold mb-8">Are you an...</Text>

      {["Individual", "Organization"].map((option) => (
        <TouchableOpacity
          key={option}
          className="bg-black w-full p-4 mb-4 rounded-xl"
          onPress={() => handleSelect(option)}
        >
          <Text className="text-white text-center">{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TypeScreen;
