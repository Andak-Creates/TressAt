import * as React from "react";
import { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function BottomSheet({ visible, onClose, children }: Props) {
  const translateY = useSharedValue(SCREEN_HEIGHT);

  // Animate open / close
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(SCREEN_HEIGHT * 0.3, { damping: 20 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20 });
    }
  }, [visible]);

  // Drag gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(
        SCREEN_HEIGHT * 0.3,
        translateY.value + event.translationY
      );
    })
    .onEnd(() => {
      if (translateY.value > SCREEN_HEIGHT * 0.6) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(SCREEN_HEIGHT * 0.3, { damping: 20 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      {/* Backdrop overlay */}
      {visible && (
        <Pressable style={styles.backdrop} onPress={onClose}>
          <View />
        </Pressable>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  handle: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 10,
  },
});
