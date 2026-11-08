import { useCallback, useEffect, useRef, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { randomUUID } from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, Text, View } from "react-native";
import {
  CATEGORIES,
  Category,
  score,
  totals,
  winners,
} from "../../../src/game/engine";
import type { Move } from "../../../src/game/engine";
import { Avatar, Button, Copy, Heading, Page, s } from "../components/ui";
import { RollCounter, RollingDie } from "../components/rolling-die";
import {
  Challenge,
  ChallengeRequest,
  challengeRequest,
} from "../lib/challenges";
import { useOnline } from "../online-context";
import { labels } from "../game-labels";
import { colors as c } from "../theme";
export default function OnlineGame() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useOnline();
  return <OnlineGameBody key={`${id}.${session?.user.id}`} />;
}
function OnlineGameBody() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, ready } = useOnline();
  const [match, setMatch] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [pending, setPending] = useState<ChallengeRequest | null>(null);
  const [loaded, setLoaded] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = session?.user.id;
  const storageKey = `dicey.pending.${session?.user.id}.${id}`;
  const refresh = useCallback(async () => {
    try {
      const data = await challengeRequest({ action: "get", matchId: id });
      if (mounted.current && data.match)
        setMatch((current) =>
          !current || data.match!.revision >= current.revision
            ? data.match!
            : current,
        );
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Could not refresh");
    }
  }, [id]);
  useEffect(() => {
    mounted.current = true;
    if (!userId) return;
    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const saved = JSON.parse(raw);
          if (
            saved.action === "move" &&
            saved.matchId === id &&
            typeof saved.requestId === "string"
          )
            setPending(saved);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (active)
          setError(
            "Could not restore a pending move. Check your connection and refresh.",
          );
      });
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => {
      if (!lock.current) void refresh();
    }, 10000);
    return () => {
      clearTimeout(initial);
      active = false;
      mounted.current = false;
      clearInterval(timer);
      if (rollTimer.current) clearTimeout(rollTimer.current);
    };
  }, [userId, id, storageKey, refresh]);
  async function send(request: ChallengeRequest) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setSelected(null);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(request));
      setPending(request);
      const response = await challengeRequest(request);
      await AsyncStorage.removeItem(storageKey);
      if (!mounted.current) return;
      setPending(null);
      if (response.match)
        setMatch((current) =>
          !current || response.match!.revision >= current.revision
            ? response.match!
            : current,
        );
      if (request.action === "move" && request.move.kind === "roll") {
        setRolling(true);
        rollTimer.current = setTimeout(() => {
          setRolling(false);
          lock.current = false;
          setBusy(false);
        }, 950);
      } else {
        lock.current = false;
        setBusy(false);
      }
      void refresh();
    } catch (e) {
      if (mounted.current) {
        setError(e instanceof Error ? e.message : "Could not send move");
        setBusy(false);
      }
      lock.current = false;
    }
  }
  async function recover() {
    // A failed request might have committed. Refresh before choosing a new action.
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await challengeRequest({ action: "get", matchId: id });
      if (result.match) setMatch(result.match);
      await AsyncStorage.removeItem(storageKey);
      setPending(null);
      setError(null);
    } catch {
      setError(
        "Could not check the server. Keep this move pending and try again.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <Page>
        <Copy>Checking your account…</Copy>
      </Page>
    );
  if (!session) return <Redirect href="/online" />;
  if (!match)
    return (
      <Page>
        <Heading>Finding your challenge…</Heading>
        {error && <Copy>{error}</Copy>}
        <Button title="Refresh" onPress={() => void refresh()} />
        <Button
          title="Back to challenges"
          secondary
          onPress={() => router.replace("/online")}
        />
      </Page>
    );
  const game = match.state;
  const mine =
    game?.status === "playing" &&
    game.players[game.currentPlayer].id === session.user.id;
  const blocked = busy || !!pending || !loaded || !mine;
  const avatar = (playerId: string) =>
    playerId === match.host_id ? match.host_avatar : (match.guest_avatar ?? 0);
  const localPlayer = game?.players.find((p) => p.id === session.user.id);
  const preview = selected && game?.dice ? score(selected, game.dice) : null;
  const move = (move: Move) =>
    void send({
      action: "move",
      requestId: randomUUID(),
      matchId: match.id,
      revision: match.revision,
      move,
    });
  return (
    <Page
      footer={
        selected && preview !== null ? (
          <View style={{ gap: 8, paddingBottom: 8 }}>
            <Text style={s.label}>
              {labels[selected]} · {preview} points
            </Text>
            {preview === 0 && (
              <Text style={s.muted}>Uses this category for zero points.</Text>
            )}
            <Button
              title={`Score ${preview} ${preview === 1 ? "point" : "points"} →`}
              disabled={blocked}
              onPress={() => move({ kind: "score", category: selected })}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelected(null)}
              style={{
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={s.muted}>Cancel</Text>
            </Pressable>
          </View>
        ) : undefined
      }
    >
      <Heading>
        {match.status === "waiting"
          ? "Start a rivalry"
          : match.status === "complete"
            ? "The dice have spoken!"
            : mine
              ? "Your turn!"
              : "Their turn"}
      </Heading>
      {error && <Copy>{error}</Copy>}
      {pending && (
        <View style={s.panel}>
          <Copy>
            A move needs checking. Retry safely, or refresh from the server
            before continuing.
          </Copy>
          <Button
            title="Retry pending move"
            disabled={busy}
            onPress={() => void send(pending)}
          />
          <Button
            title="Check server & continue"
            secondary
            disabled={busy}
            onPress={() => void recover()}
          />
        </View>
      )}
      {match.status === "waiting" && (
        <View style={s.panel}>
          <Copy>Share this invitation code with a friend:</Copy>
          <Text selectable style={[s.heading, { color: c.mint, fontSize: 24 }]}>
            {match.invite_code}
          </Text>
          <Copy>
            They can sign in and enter it under Challenge friends. Invitations
            last seven days.
          </Copy>
        </View>
      )}
      {game && (
        <>
          <View style={s.wrap}>
            {game.players.map((p) => (
              <View key={p.id} style={{ alignItems: "center", gap: 6 }}>
                <Avatar index={avatar(p.id)} size={64} />
                <Text style={s.label}>{p.name}</Text>
                <Text style={s.muted}>{totals(p.scores).total} pts</Text>
              </View>
            ))}
          </View>
          {game.status === "complete" ? (
            <Copy>
              {winners(game)
                .map((p) => p.name)
                .join(" & ")}{" "}
              {winners(game).length > 1 ? "share the win!" : "wins!"}
            </Copy>
          ) : (
            <>
              <Copy>
                {mine
                  ? "Tap dice to hold them, then roll or choose a score."
                  : `${game.players[game.currentPlayer].name} is up. You can leave and come back later.`}
              </Copy>
              <RollCounter remaining={3 - game.rolls} />
              <View style={[s.panel, { borderColor: c.blue }]}>
                <View style={[s.row, { gap: 8 }]}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <RollingDie
                      key={i}
                      index={i}
                      rolling={rolling}
                      value={game.dice?.[i] ?? 0}
                      held={game.held[i]}
                      disabled={blocked || !game.dice}
                      onPress={() => move({ kind: "hold", index: i })}
                    />
                  ))}
                </View>
              </View>
              <Button
                title={
                  busy
                    ? "Rolling / saving…"
                    : game.rolls === 3
                      ? "Pick a score"
                      : "Roll dice ↻"
                }
                disabled={blocked || game.rolls === 3}
                onPress={() => move({ kind: "roll" })}
              />
            </>
          )}
          {(game.status === "complete"
            ? game.players
            : localPlayer
              ? [localPlayer]
              : []
          ).map((p) => (
            <View key={p.id} style={s.panel}>
              <Text style={s.label}>{p.name}’s scorecard</Text>
              {CATEGORIES.map((category) => {
                const used = p.scores[category] !== undefined;
                const value =
                  p.scores[category] ??
                  (mine && game.dice ? score(category, game.dice) : "—");
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityLabel={`${labels[category]}, ${value}${used ? ", scored" : ""}`}
                    accessibilityState={{
                      disabled: blocked || used || !game.dice,
                      selected: selected === category,
                    }}
                    disabled={blocked || used || !game.dice}
                    onPress={() => setSelected(category)}
                    style={[
                      s.row,
                      {
                        minHeight: 52,
                        justifyContent: "space-between",
                        padding: 10,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor:
                          selected === category ? c.mint : "transparent",
                      },
                    ]}
                  >
                    <Text style={s.label}>
                      {labels[category]}
                      {used ? " ✓" : ""}
                    </Text>
                    <Text style={s.label}>{value}</Text>
                  </Pressable>
                );
              })}
              <Text style={s.muted}>
                Upper {totals(p.scores).upper} + bonus {totals(p.scores).bonus}{" "}
                + bottom {totals(p.scores).lower}
              </Text>
              <Text style={s.label}>Grand total: {totals(p.scores).total}</Text>
            </View>
          ))}
        </>
      )}
      <Button
        title="Refresh challenge"
        secondary
        disabled={busy}
        onPress={() => void refresh()}
      />
      <Button
        title="All challenges →"
        secondary
        onPress={() => router.replace("/online")}
      />
    </Page>
  );
}
