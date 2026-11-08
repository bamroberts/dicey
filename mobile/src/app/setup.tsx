import { useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { Avatar, Button, Copy, Heading, Page, s } from "../components/ui";
import { useGame } from "../game-context";
import { avatars, colors as c } from "../theme";
export default function Setup() {
  const { seats: savedSeats, game, startGame } = useGame();
  const [seats, setSeats] = useState(savedSeats);
  const valid = seats.every((p) => p.name.trim().length > 0);
  return (
    <Page>
      <Heading>Pick your crew</Heading>
      <Copy>Names, faces, friendly rivalries.</Copy>
      {seats.map((p, i) => (
        <View key={p.id} style={s.panel}>
          <View style={s.row}>
            <Avatar index={p.avatar} size={64} />
            <TextInput
              accessibilityLabel={`Player ${i + 1} name`}
              maxLength={20}
              value={p.name}
              onChangeText={(name) =>
                setSeats(
                  seats.map((seat, j) => (i === j ? { ...seat, name } : seat)),
                )
              }
              placeholder={`Player ${i + 1}`}
              placeholderTextColor={c.muted}
              style={{
                flex: 1,
                color: c.ivory,
                fontSize: 22,
                fontWeight: "800",
                padding: 10,
                borderBottomWidth: 2,
                borderBottomColor: c.blue,
              }}
            />
          </View>
          <View style={s.wrap}>
            {avatars.map((name, avatar) => (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={`${name} for player ${i + 1}`}
                accessibilityState={{ selected: p.avatar === avatar }}
                onPress={() =>
                  setSeats(
                    seats.map((seat, j) =>
                      i === j ? { ...seat, avatar } : seat,
                    ),
                  )
                }
                style={{
                  borderWidth: 2,
                  borderColor: p.avatar === avatar ? c.mint : "transparent",
                  borderRadius: 30,
                  padding: 2,
                }}
              >
                <Avatar index={avatar} size={48} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <View style={s.row}>
        {seats.length < 4 && (
          <View style={{ flex: 1 }}>
            <Button
              title="+ Player"
              secondary
              onPress={() =>
                setSeats([
                  ...seats,
                  {
                    id: `p${seats.length + 1}`,
                    name: `Player ${seats.length + 1}`,
                    avatar: seats.length,
                  },
                ])
              }
            />
          </View>
        )}
        {seats.length > 2 && (
          <View style={{ flex: 1 }}>
            <Button
              title="− Player"
              secondary
              onPress={() => setSeats(seats.slice(0, -1))}
            />
          </View>
        )}
      </View>
      {!valid && (
        <Text style={s.muted}>Give every player a name to start.</Text>
      )}
      {game?.status === "playing" && (
        <Copy>
          Starting a new game replaces the current game on this device.
        </Copy>
      )}
      <Button
        title={
          game?.status === "playing"
            ? "Replace current game & roll"
            : "Let's roll!"
        }
        disabled={!valid}
        onPress={() => {
          startGame(seats);
          router.replace("/play");
        }}
      />
      <Button title="Back home" secondary onPress={() => router.back()} />
    </Page>
  );
}
