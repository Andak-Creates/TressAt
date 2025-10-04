"use client";

import { useAuth } from "@/context/AuthContext";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const SignUp = () => {
  const { signUp } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // 🔹 Get user location
  const handleGetLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need location access to continue");
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
    });
  };

  // 🔹 Handle sign-up
  const handleSignUp = async () => {
    if (!fullName || !email || !password || !location) {
      Alert.alert(
        "Missing Info",
        "Please fill in all fields including location."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, "customer", fullName, undefined, location);

      Alert.alert("Success", "Account created successfully!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
      console.log("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/tress-bg.png")}
      resizeMode="cover"
      className="h-full w-full pt-[10px] px-[30px]"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="py-[100px]"
            contentContainerStyle={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View className="w-full mb-[10px]">
              <Text className="text-white text-center text-[35px] font-bold">
                Create An Account
              </Text>
              <Text className="text-white text-[16px] text-center">
                Join the TressAt community
              </Text>
            </View>

            <View className="w-full mt-[20px]">
              <View className="flex flex-row justify-between gap-2">
                <View className="w-[48%] labelInput">
                  <Text className="defaultText">Full Name</Text>
                  <TextInput
                    placeholder="Full Name"
                    placeholderTextColor="#aaa"
                    value={fullName}
                    onChangeText={setFullName}
                    className="bg-white rounded-lg p-3 mb-4"
                  />
                </View>

                <View className="w-[48%] labelInput">
                  <Text className="defaultText">Email</Text>
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    className="bg-white rounded-lg p-3 mb-4"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View>
                <View className="labelInput">
                  <Text className="defaultText">Password</Text>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    className="bg-white rounded-lg p-3 mb-4"
                    secureTextEntry
                  />
                </View>

                <View className="labelInput mt-[10px]">
                  <Text className="defaultText">Confirm Password</Text>
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor="#aaa"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    className="bg-white rounded-lg p-3 mb-4"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                className="bg-gray-700 rounded-lg p-3 mb-4 mt-[10px]"
                onPress={handleGetLocation}
              >
                <Text className="text-white text-center">
                  {location
                    ? `📍 Location set: ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`
                    : "Set My Location"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-sky-500 rounded-lg p-3 mt-[10px]"
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text className="text-white text-center font-semibold">
                  {loading ? "Creating account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-[30px]">
              <Text className="text-center text-[14px] text-white">
                Already have an account?{" "}
                <Text
                  onPress={() => router.push("/(customer)/Login")}
                  className="text-blue-500 cursor-pointer"
                >
                  Click to Log In
                </Text>
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default SignUp;
