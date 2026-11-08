import { OnlineProvider } from "../online-context";
import { useFonts } from "expo-font";
import { NunitoSans_800ExtraBold } from "@expo-google-fonts/nunito-sans/800ExtraBold";
import { LilitaOne_400Regular } from "@expo-google-fonts/lilita-one/400Regular";
import { NunitoSans_400Regular } from "@expo-google-fonts/nunito-sans/400Regular";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GameProvider } from "../game-context";
export default function Layout() {
  const [loaded, error] = useFonts({
    LilitaOne_400Regular,
    NunitoSans_400Regular,
    NunitoSans_800ExtraBold,
  });
  if (!loaded && !error) return null;
  return (
    <OnlineProvider>
      <GameProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#101522" },
            animation: "none",
          }}
        />
      </GameProvider>
    </OnlineProvider>
  );
}
