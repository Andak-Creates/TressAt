"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
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
  const [loading, setloading] = useState<boolean>(false);

  //store location
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

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
    }

    try {
      setloading(true);
      const userId = await signUp(email, password, "customer", fullName);
      if (!userId) throw new Error("User Id not returned.");

      // insert location
      const { error } = await supabase
        .from("profiles")
        .update({
          location: `POINT(${location.lng} ${location.lat})`, //geography point
        })
        .eq("id", userId);

      if (error) throw error;
      Alert.alert("Success", "Account created successfully!");
      console.log("Success", "Account created successfully!");
      router.replace("/(customer-tabs)/Home");
    } catch (err: any) {
      Alert.alert("Error", err.message);
      console.log("Error", err.message);
    } finally {
      setloading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bigBackground.png")}
      resizeMode="cover"
      className="h-full w-full pt-[10px] px-[30px]"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="py-[100px] "
            contentContainerStyle={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="text-white text-[20px] font-bold">
              Customer Sign Up
            </Text>

            <View className="w-full mt-[20px]">
              <View className="flex flex-row justify-between gap-2">
                {/* full name */}
                <View className="w-[48%] labelInput">
                  <Text className="defaultText">Full Name</Text>
                  <TextInput
                    placeholder="Full Name"
                    placeholderTextColor={"#aaa"}
                    value={fullName}
                    onChangeText={setFullName}
                    className="bg-white rounded-lg p-3 mb-4"
                  />
                </View>

                {/* Email */}
                <View className="w-[48%] labelInput">
                  <Text className="defaultText">Email</Text>
                  {/* email */}
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={"#aaa"}
                    value={email}
                    onChangeText={setEmail}
                    className="bg-white rounded-lg p-3 mb-4"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="mt-[10px]">
                {/* Password */}
                <View className="labelInput">
                  <Text className="defaultText">Password</Text>
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={"#aaa"}
                    value={password}
                    onChangeText={setPassword}
                    className="bg-white rounded-lg p-3 mb-4"
                    secureTextEntry
                  />
                </View>

                {/* Confirm password */}
                <View className="labelInput">
                  <Text className="defaultText">Confirm Password</Text>
                  <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor={"#aaa"}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    className="bg-white rounded-lg p-3 mb-4"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                className="bg-gray-700 rounded-lg p-3 mb-4"
                onPress={handleGetLocation}
              >
                <Text className="text-white text-center">
                  {location
                    ? `📍 Location set: ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`
                    : "Set My Location"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-sky-500 rounded-lg p-3"
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text className="text-white text-center font-semibold">
                  {loading ? "Creating account..." : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-[20px]">
              <Text className="defaultText">
                Already have an account?{" "}
                <Text
                  onPress={() => router.push("/(customer)/Login")}
                  className="text-blue-500 
            cursor-pointer"
                >
                  Click here
                </Text>{" "}
                to Log in
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default SignUp;
