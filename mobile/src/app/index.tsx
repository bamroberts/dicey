import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { Avatar, Brand, Button, Copy, Page, s } from "../components/ui";
import { useGame } from "../game-context";
import { colors as c } from "../theme";
export default function Home() {
  const { game, setGame, setHandoff, saveError } = useGame();
  const [abandon, setAbandon] = useState(false);
  return (
    <Page>
      <Brand />
      {saveError && <Copy>{saveError}</Copy>}
      <View style={s.wrap}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Avatar key={i} index={i} size={88} />
        ))}
      </View>
      <Text
        style={{
          color: c.pink,
          fontSize: 36,
          fontWeight: "900",
          textAlign: "center",
        }}
      >
        Small dice. Big energy.
      </Text>
      <Copy>Pick your crew. Push your luck. Make every roll count.</Copy>
      {game?.status === "playing" && (
        <Button title="Resume game →" onPress={() => router.push("/play")} />
      )}
      {game?.status === "complete" && (
        <Button
          title="View last results →"
          secondary
          onPress={() => router.push("/play")}
        />
      )}
      {game?.status === "playing" &&
        (abandon ? (
          <View style={s.panel}>
            <Copy>Abandon this game? Its scores will be cleared.</Copy>
            <Button
              title="Yes, abandon game"
              secondary
              onPress={() => {
                setGame(null);
                setHandoff(false);
                setAbandon(false);
              }}
            />
            <Button title="Keep the game" onPress={() => setAbandon(false)} />
          </View>
        ) : (
          <Button
            title="Abandon game"
            secondary
            onPress={() => setAbandon(true)}
          />
        ))}
      <Button title="Play together →" onPress={() => router.push("/setup")} />
      <Button
        title="Challenge friends →"
        secondary
        onPress={() => router.push("/online")}
      />
      <Button
        title="Game history →"
        secondary
        onPress={() => router.push("/history")}
      />
      <Copy>2–4 players · One device · No account needed</Copy>
    </Page>
  );
}
