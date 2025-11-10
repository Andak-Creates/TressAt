import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CardProps {
  name: string;
  value: string;
  trend: number;
  naira?: boolean;
}

const OverviewCard = ({ name, value, trend, naira }: CardProps) => {
  return (
    <TouchableOpacity className="flex flex-row justify-between gap-[10px] rounded-2xl bg-white p-[20px] w-full">
      <View className="flex flex-col">
        <Text className="text-[14px] ">{name}</Text>
        <Text className="text-[30px] font-semibold">
          {naira && <FontAwesome6 name="naira-sign" size={25} />}
          {value}
        </Text>

        <Text className="text-green-500">+{trend}%</Text>
      </View>

      <View className="flex self-end justify-center items-center">
        <FontAwesome6 name="chart-pie" size={50} />
        <Text>View Analytics</Text>
      </View>
    </TouchableOpacity>
  );
};

export default OverviewCard;
