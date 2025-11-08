import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function DetailScreen() {
  const router = useRouter();
  const { role, account_type, specialty, name } = useLocalSearchParams<{
    role?: string;
    account_type?: string;
    specialty?: string;
    name?: string;
  }>();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    location: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (!form.fullName || !form.phone || !form.email) {
      Alert.alert("Missing info", "Please fill out all fields.");
      return;
    }

    router.push({
      pathname: "/(provider)/(auth)/PaymentScreen", // ✅ Updated route
      params: {
        ...form,
        role,
        account_type,
        specialty,
        business_name: name,
      },
    });
  };

  return (
    <ImageBackground
      source={require("@/assets/images/tress-bg.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center p-6">
            <Text className="text-2xl font-bold mb-6 text-white">
              Enter your details
            </Text>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#ccc"
              className="border border-gray-300 rounded-xl p-4 mb-4 text-white"
              value={form.fullName}
              onChangeText={(t) => handleChange("fullName", t)}
            />

            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#ccc"
              className="border border-gray-300 rounded-xl p-4 mb-4 text-white"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(t) => handleChange("phone", t)}
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor="#ccc"
              className="border border-gray-300 rounded-xl p-4 mb-4 text-white"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => handleChange("email", t)}
            />

            <TouchableOpacity
              className="bg-black p-4 rounded-xl"
              onPress={handleNext}
            >
              <Text className="text-white text-center">Proceed to Payment</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
