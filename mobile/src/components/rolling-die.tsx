import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Text, View } from "react-native";
import { Die, s } from "./ui";
import { colors as c } from "../theme";
export function RollingDie({
  rolling,
  index,
  ...props
}: React.ComponentProps<typeof Die> & { rolling: boolean; index: number }) {
  const [progress] = useState(() => new Animated.Value(1));
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (!rolling || props.held || reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.delay(index * 70),
      Animated.spring(progress, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [rolling, props.held, index, progress, reduced]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.25, 1],
        }),
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-22, 0],
            }),
          },
          {
            rotate: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["-16deg", "0deg"],
            }),
          },
        ],
      }}
    >
      <Die {...props} />
    </Animated.View>
  );
}
export function RollCounter({ remaining }: { remaining: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`${remaining} rolls remaining`}
      style={{ alignItems: "center", gap: 8 }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={s.row}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 25,
              height: 25,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: i < remaining ? c.mint : "#52607E",
              backgroundColor: i < remaining ? c.mint : c.panel,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i < remaining ? c.night : "#52607E",
              }}
            />
          </View>
        ))}
      </View>
      <Text style={s.muted}>{remaining} rolls left</Text>
    </View>
  );
}
