import { useAuth } from "@/context/AuthContext"; // ✅ Import context
import { useRouter } from "expo-router";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

export default function ChooseRole() {
  const router = useRouter();
  const { setRole } = useAuth(); // ✅ get setRole to update context

  const handleSelect = (specialty: string) => {
    // Set the role as provider for this flow
    setRole("provider");

    // Push to the next screen with both role and specialty
    router.push({
      pathname: "/(provider)/(auth)/TypeScreen",
      params: { role: "provider", specialty },
    });
  };

  return (
    <ImageBackground
      className="flex-1"
      source={require("@/assets/images/tress-bg.png")}
      resizeMode="cover"
    >
      <View className="flex-1 justify-center items-center py-6 px-[30px]">
        <Text className="text-2xl font-bold mb-8 text-white">
          Which of the following are you?
        </Text>

        {["Hair Plaiter", "Hair Stylist", "Barber"].map((option) => (
          <TouchableOpacity
            key={option}
            className="bg-black w-full p-4 mb-4 rounded-xl"
            onPress={() => handleSelect(option)}
          >
            <Text className="text-white text-center">{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ImageBackground>
  );
}
