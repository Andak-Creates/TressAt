import { useAuth } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function NameScreen() {
  const router = useRouter();
  const { role, account_type, specialty } = useLocalSearchParams<{
    role?: string;
    account_type?: string;
    specialty?: string;
  }>();
  const { updateFullName } = useAuth();

  const [name, setName] = useState("");

  const handleNext = () => {
    if (!name.trim()) return;

    // ✅ Save to global context (temporary until Supabase insert)
    updateFullName(name.trim());

    // ✅ Move to details screen with all data carried forward
    router.push({
      pathname: "/(provider)/(auth)/DetailScreen",
      params: {
        role,
        account_type,
        specialty,
        name: name.trim(),
      },
    });
  };

  return (
    <View className="flex-1 bg-white justify-center p-6">
      <Text className="text-2xl font-bold mb-6">
        What’s the name of your business or yourself?
      </Text>

      <TextInput
        placeholder="Enter name"
        className="border border-gray-300 rounded-xl p-4 mb-6"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity
        className={`p-4 rounded-xl ${name ? "bg-black" : "bg-gray-400"}`}
        onPress={handleNext}
        disabled={!name}
      >
        <Text className="text-white text-center">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
