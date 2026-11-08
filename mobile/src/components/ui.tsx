import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors as c, avatars } from "../theme";
export function Page({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer && (
        <View
          style={{
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 8,
            backgroundColor: c.night,
            borderTopWidth: 2,
            borderTopColor: c.blue,
          }}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function Copy({ children }: { children: React.ReactNode }) {
  return <Text style={s.copy}>{children}</Text>;
}
export function Brand() {
  return (
    <View style={s.brand}>
      <Text style={s.spark}>✦ LET THE GOOD TIMES ROLL ✦</Text>
      <Text accessibilityRole="header" style={s.logo}>
        Dicey<Text style={{ color: c.pink }}>!</Text>
      </Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: secondary ? c.pink : c.mint },
        disabled && { backgroundColor: c.muted, opacity: 0.55 },
        pressed && { transform: [{ translateY: 3 }] },
      ]}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
}
export function Avatar({ index, size = 80 }: { index: number; size?: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`${avatars[index]} avatar`}
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        borderRadius: size / 2,
      }}
    >
      <Image
        source={require("../../assets/avatars.png")}
        style={{
          position: "absolute",
          width: size * 3,
          height: size * 2,
          left: -(index % 3) * size,
          top: -Math.floor(index / 3) * size,
        }}
      />
    </View>
  );
}
const layouts = [
  [],
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
];
export function Die({
  value,
  held,
  onPress,
  disabled,
}: {
  value: number;
  held: boolean;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        value
          ? `Die ${value}, ${held ? "held, tap to release" : "tap to hold"}`
          : "Unrolled die"
      }
      accessibilityState={{ selected: held, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={s.dieWrap}
    >
      <View
        style={[
          s.die,
          held && { borderColor: c.mint, backgroundColor: "#E8FFD2" },
        ]}
      >
        {Array.from({ length: 9 }, (_, i) => (
          <View key={i} style={s.pipCell}>
            <View
              style={[s.pip, { opacity: layouts[value].includes(i) ? 1 : 0 }]}
            />
          </View>
        ))}
      </View>
      <Text style={[s.held, { color: held ? c.mint : c.muted }]}>
        {held ? "HELD" : value ? "KEEP?" : "—"}
      </Text>
    </Pressable>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.night },
  page: {
    padding: 20,
    gap: 22,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingBottom: 44,
  },
  brand: { alignItems: "center", paddingVertical: 16 },
  spark: {
    color: c.mint,
    fontSize: 11,
    fontFamily: "LilitaOne_400Regular",
    letterSpacing: 2,
  },
  logo: {
    color: c.ivory,
    fontSize: 88,
    fontFamily: "LilitaOne_400Regular",
    letterSpacing: -6,
    textShadowColor: c.purple,
    textShadowOffset: { width: 4, height: 6 },
    textShadowRadius: 0,
    transform: [{ rotate: "-5deg" }],
  },
  heading: {
    color: c.ivory,
    fontSize: 30,
    fontFamily: "LilitaOne_400Regular",
    textAlign: "center",
  },
  copy: {
    color: c.muted,
    fontFamily: "NunitoSans_400Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    borderRadius: 22,
    padding: 18,
    minHeight: 58,
    borderBottomWidth: 6,
    borderBottomColor: c.purple,
    alignItems: "center",
  },
  buttonText: {
    color: c.night,
    fontSize: 21,
    fontFamily: "LilitaOne_400Regular",
    textAlign: "center",
  },
  panel: {
    backgroundColor: c.panel,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: "#354266",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  label: {
    color: c.ivory,
    fontSize: 17,
    fontFamily: "NunitoSans_800ExtraBold",
  },
  muted: { color: c.muted, fontSize: 14 },
  dieWrap: { flex: 1, minHeight: 82, alignItems: "center", gap: 8 },
  die: {
    width: "100%",
    maxWidth: 76,
    aspectRatio: 1,
    backgroundColor: c.ivory,
    borderWidth: 3,
    borderColor: "#C2B5A2",
    borderRadius: 13,
    padding: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },
  pipCell: {
    width: "33.333333%",
    height: "33.333333%",
    justifyContent: "center",
    alignItems: "center",
  },
  pip: {
    width: "65%",
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: c.night,
  },
  held: { fontSize: 10, fontFamily: "LilitaOne_400Regular" },
});
