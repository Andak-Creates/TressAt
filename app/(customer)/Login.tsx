"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const Login = () => {
  const { logIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter correct email and password.");
      return;
    }

    try {
      setLoading(true);
      await logIn(email, password, "customer"); // forcing customer role here
      router.replace("/(customer-tabs)/Home");
    } catch (err: any) {
      Alert.alert("Login Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bigBackground.png")}
      className="h-full w-full object-cover pt-[100px] px-[30px]"
    >
      <KeyboardAvoidingView>
        <TouchableWithoutFeedback>
          <ScrollView>
            <View>
              <Text className="defaultText">Login Form</Text>
            </View>

            <View className="flex flex-col w-full">
              <Text>Email</Text>
              <TextInput
                placeholder="Email"
                placeholderTextColor={"#aaa"}
                value={email}
                onChangeText={setEmail}
                className="bg-white rounded-lg p-3"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View className="flex flex-col w-full">
              <Text>Password</Text>
              <TextInput
                placeholder="Password"
                placeholderTextColor={"#aaa"}
                value={password}
                onChangeText={setPassword}
                className="bg-white rounded-lg p-3"
                secureTextEntry
              />
            </View>

            {/* Login in button */}

            <TouchableOpacity
              className="bg-sky-500
            rounded-lg p-3 mt-4"
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="defaultText">
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default Login;
