import { useEffect, useRef, useState } from "react";
import { Redirect, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  CATEGORIES,
  Category,
  commitScore,
  rollDice,
  round,
  score,
  toggleHold,
  totals,
  winners,
} from "../../../src/game/engine";
import { Avatar, Button, Copy, Heading, Page, s } from "../components/ui";
import { useGame } from "../game-context";
import { RollCounter, RollingDie } from "../components/rolling-die";
import { colors as c } from "../theme";
const labels: Record<Category, string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threeOfAKind: "Three of a kind",
  fourOfAKind: "Four of a kind",
  fullHouse: "Full house",
  smallStraight: "Small straight",
  largeStraight: "Large straight",
  yahtzee: "Yahtzee!",
  chance: "Chance",
};
export default function Play() {
  const { game, setGame, seats, handoff, setHandoff, saveError } = useGame();
  const [selected, setSelected] = useState<Category | null>(null);
  const [rolling, setRolling] = useState(false);
  const rollLock = useRef(false);
  const commitLock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  if (!game) return <Redirect href="/" />;
  const player = game.players[game.currentPlayer];
  const avatar = (id: string) => seats.find((p) => p.id === id)?.avatar ?? 0;
  if (game.status === "complete")
    return (
      <Page>
        <Heading>
          {winners(game).length > 1 ? "Shared glory!" : "What a game!"}
        </Heading>
        <View style={s.wrap}>
          {winners(game).map((p) => (
            <View key={p.id} style={{ alignItems: "center", gap: 10 }}>
              <Avatar index={avatar(p.id)} size={100} />
              <Text style={s.label}>{p.name} wins!</Text>
            </View>
          ))}
        </View>
        <Copy>The dice have spoken. Time for a rematch?</Copy>
        {game.players.map((p) => (
          <View key={p.id} style={s.panel}>
            <Text style={s.label}>
              {p.name} · {totals(p.scores).total} points
            </Text>
            {CATEGORIES.map((category) => (
              <View
                key={category}
                style={[s.row, { justifyContent: "space-between" }]}
              >
                <Text style={s.muted}>{labels[category]}</Text>
                <Text style={s.label}>{p.scores[category]}</Text>
              </View>
            ))}
            <Text style={s.label}>
              Upper subtotal: {totals(p.scores).upper}
            </Text>
            <Text style={s.muted}>Upper bonus: {totals(p.scores).bonus}</Text>
            <Text style={s.label}>
              Bottom subtotal: {totals(p.scores).lower}
            </Text>
            <Text style={[s.label, { color: c.mint }]}>
              Grand total: {totals(p.scores).total}
            </Text>
          </View>
        ))}
        <Button title="Play again →" onPress={() => router.replace("/setup")} />
        <Button title="Home" secondary onPress={() => router.replace("/")} />
      </Page>
    );
  if (handoff)
    return (
      <Page>
        <View style={{ alignItems: "center", paddingTop: 60, gap: 24 }}>
          <Avatar index={avatar(player.id)} size={160} />
          <Heading>Pass to {player.name}</Heading>
          <Copy>Your dice. Your moment.</Copy>
        </View>
        <Button
          title="I'm ready →"
          onPress={() => {
            commitLock.current = false;
            setHandoff(false);
          }}
        />
      </Page>
    );
  const preview = selected && game.dice ? score(selected, game.dice) : null;
  const total = totals(player.scores);
  return (
    <Page
      footer={
        selected && preview !== null ? (
          <View style={[s.panel, { padding: 12, gap: 8 }]}>
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Text style={[s.label, { flex: 1 }]}>
                {labels[selected]} · {preview}{" "}
                {preview === 1 ? "point" : "points"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel score selection"
                onPress={() => setSelected(null)}
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={s.muted}>Cancel</Text>
              </Pressable>
            </View>
            {preview === 0 && (
              <Text style={s.muted}>Uses this category for zero points.</Text>
            )}
            <Button
              title={`Score ${preview} ${preview === 1 ? "point" : "points"} →`}
              disabled={rolling}
              onPress={() => {
                if (rolling || rollLock.current || commitLock.current) return;
                commitLock.current = true;
                const next = commitScore(game, selected);
                setGame(next);
                setSelected(null);
                setHandoff(next.status !== "complete");
              }}
            />
          </View>
        ) : undefined
      }
    >
      {saveError && <Copy>{saveError}</Copy>}
      <View style={[s.row, { justifyContent: "space-between" }]}>
        <Text style={{ color: c.mint, fontWeight: "900", fontSize: 24 }}>
          Dicey!
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/")}
          style={{ minHeight: 48, justifyContent: "center", padding: 10 }}
        >
          <Text style={s.muted}>Home</Text>
        </Pressable>
      </View>
      <View style={s.wrap}>
        {game.players.map((p) => (
          <View
            key={p.id}
            style={{
              alignItems: "center",
              padding: 8,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: p.id === player.id ? c.mint : "transparent",
            }}
          >
            <Avatar index={avatar(p.id)} size={52} />
            <Text numberOfLines={1} style={[s.label, { maxWidth: 105 }]}>
              {p.name}
            </Text>
            <Text style={s.muted}>{totals(p.scores).total} pts</Text>
          </View>
        ))}
      </View>
      <Heading>
        {player.name}
        {"’s turn"}
      </Heading>
      <Copy>Round {round(game)} of 13</Copy>
      <RollCounter remaining={3 - game.rolls} />
      <View
        style={[
          s.panel,
          { borderColor: c.blue, borderWidth: 3, paddingHorizontal: 12 },
        ]}
      >
        <View style={[s.row, { gap: 8 }]}>
          {Array.from({ length: 5 }, (_, i) => (
            <RollingDie
              rolling={rolling}
              index={i}
              key={i}
              value={game.dice?.[i] ?? 0}
              held={game.held[i]}
              disabled={!game.dice || rolling}
              onPress={() => setGame(toggleHold(game, i))}
            />
          ))}
        </View>
      </View>
      <Copy>
        {game.rolls === 0
          ? "Roll the dice to get started."
          : game.rolls === 3
            ? "Pick a category to bank your points."
            : "Tap dice to keep them, or pick your score."}
      </Copy>
      <Button
        title={
          rolling
            ? "Rolling…"
            : game.rolls === 3
              ? "No rolls left — pick a score"
              : game.rolls
                ? "Roll again ↻"
                : "Roll dice ↻"
        }
        disabled={game.rolls >= 3 || rolling}
        onPress={() => {
          if (rollLock.current || game.rolls >= 3) return;
          rollLock.current = true;
          setRolling(true);
          setSelected(null);
          setGame(rollDice(game));
          timer.current = setTimeout(() => {
            rollLock.current = false;
            setRolling(false);
          }, 950);
        }}
      />
      <View style={s.panel}>
        <Text style={s.label}>Your scorecard</Text>
        <Text style={s.muted}>
          Upper section {total.upper}/63 · Bonus {total.bonus}/35
        </Text>
        {CATEGORIES.map((category, i) => {
          const committed = player.scores[category];
          const available = committed === undefined;
          const value =
            committed ?? (game.dice ? score(category, game.dice) : "—");
          return (
            <View key={category}>
              {i === 6 && (
                <Text style={[s.label, { paddingVertical: 12 }]}>
                  Upper subtotal: {total.upper} · Bonus: {total.bonus}
                  {"\n"}Combinations
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${labels[category]}, ${value} points${available ? ", preview" : ", already scored"}`}
                accessibilityState={{
                  disabled: !available || !game.dice || rolling,
                  selected: selected === category,
                }}
                disabled={!available || !game.dice || rolling}
                onPress={() => setSelected(category)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 13,
                  minHeight: 52,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selected === category ? c.mint : "transparent",
                  backgroundColor:
                    selected === category ? "#293A32" : "transparent",
                }}
              >
                <Text
                  style={[s.label, { color: available ? c.ivory : c.muted }]}
                >
                  {labels[category]}
                  {!available ? " ✓" : ""}
                </Text>
                <Text
                  style={[s.label, { color: available ? c.mint : c.muted }]}
                >
                  {value}
                </Text>
              </Pressable>
            </View>
          );
        })}
        <Text style={s.label}>Bottom subtotal: {total.lower}</Text>
        <Text style={[s.label, { color: c.mint }]}>
          Grand total: {total.total}
        </Text>
      </View>
    </Page>
  );
}
