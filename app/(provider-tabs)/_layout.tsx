"use client";

import { FontAwesome6 } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4f46e5", // Indigo
        tabBarInactiveTintColor: "#9ca3af", // Gray
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 5,
          height: 80,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />

      {/* Bookings */}
      <Tabs.Screen
        name="Bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="calendar-check" size={20} color={color} />
          ),
        }}
      />

      {/* favorites */}
      <Tabs.Screen
        name="Messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="message" size={20} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
