import { SplashScreen, useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, ImageBackground, Text, View } from "react-native";

export default function SplashScreenPage() {
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        await new Promise((resolve) => setTimeout(resolve, 3000));
        router.replace("/role-select");

        await SplashScreen.hideAsync();
      } catch (err) {
        console.warn("Slash Screen Error:", err);
        await SplashScreen.hideAsync();
        router.replace("/role-select");
      }
    };

    prepare();
  }, []);

  return (
    <ImageBackground
      source={require("../assets/images/bigBackground.png")}
      className="h-full w-full"
    >
      <View className="flex-1 justify-center items-center h-full relative">
        <Image
          source={require("../assets/images/tressatLogo.png")}
          className="h-[200px] w-[300px] "
        />
        <Text className="text-white font-semibold mt-[-10px]">
          Where the styles at?
        </Text>
      </View>
    </ImageBackground>
  );
}
