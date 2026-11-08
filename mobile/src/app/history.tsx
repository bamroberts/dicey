import { Challenge, challengeRequest } from "../lib/challenges";
import { RematchButton } from "../components/rematch-button";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { totals, winners } from "../../../src/game/engine";
import { Avatar, Button, Copy, Heading, Page, s } from "../components/ui";
import { useGame } from "../game-context";
import { useOnline } from "../online-context";
import { supabase } from "../lib/supabase";
import { decodeHistory, HistoryEntry } from "../history";
export default function History() {
  const { session } = useOnline();
  return <HistoryBody key={session?.user.id ?? "offline"} />;
}
function HistoryBody() {
  const { history, prepareRematch } = useGame();
  const { session } = useOnline();
  const [onlineGames, setOnlineGames] = useState<Challenge[]>([]);
  const [cloud, setCloud] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!session || !supabase) return;
    let active = true;
    challengeRequest({ action: "list" })
      .then((data) => {
        if (active)
          setOnlineGames(
            (data.matches ?? []).filter((m) => m.status === "complete"),
          );
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load online results. Local games are still available.",
          );
      });
    supabase
      .from("dicey_local_history")
      .select("snapshot")
      .order("finished_at", { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!active) return;
        try {
          if (error) throw error;
          setCloud(decodeHistory(data?.map((row) => row.snapshot) ?? []));
        } catch {
          setError(
            "Could not load cloud history. Local games are still available.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [session]);
  const entries = [
    ...new Map(
      [...history, ...(session ? cloud : [])].map((entry) => [entry.id, entry]),
    ).values(),
  ].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  async function backup(entry: HistoryEntry) {
    if (!supabase || !session || busy) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("dicey_local_history").upsert(
      {
        owner_id: session.user.id,
        game_id: entry.id,
        finished_at: entry.finishedAt,
        snapshot: entry,
      },
      { onConflict: "owner_id,game_id", ignoreDuplicates: true },
    );
    if (error)
      setError("Could not back up this result. Your local history is safe.");
    else setCloud((current) => [...current, entry]);
    setBusy(false);
  }
  return (
    <Page>
      <Heading>Your game shelf</Heading>
      <Copy>Your finished games, friendly rivalries, and next rematches.</Copy>
      {error && <Copy>{error}</Copy>}
      {session && (
        <Button
          title="Refresh online results"
          secondary
          disabled={busy}
          onPress={() => {
            setBusy(true);
            challengeRequest({ action: "list" })
              .then((data) => {
                setOnlineGames(
                  (data.matches ?? []).filter((m) => m.status === "complete"),
                );
                setError(null);
              })
              .catch(() =>
                setError(
                  "Could not refresh online results. Try again when connected.",
                ),
              )
              .finally(() => setBusy(false));
          }}
        />
      )}
      {onlineGames.map((match) => (
        <View key={match.id} style={s.panel}>
          <Text style={s.label}>
            Online · {new Date(match.updated_at).toLocaleDateString()}
          </Text>
          <Copy>
            {match.host_name} vs {match.guest_name}
          </Copy>
          {match.state?.players.map((p) => (
            <Text key={p.id} style={s.label}>
              {p.name} · {totals(p.scores).total} points
            </Text>
          ))}
          <RematchButton matchId={match.id} />
          <Button
            title="View scorecards"
            secondary
            onPress={() =>
              router.push({ pathname: "/challenge", params: { id: match.id } })
            }
          />
        </View>
      ))}
      <Text style={s.label}>Pass-and-play games</Text>
      {entries.length === 0 && (
        <Copy>Your first finished game will appear here.</Copy>
      )}
      {entries.map((entry) => (
        <View key={entry.id} style={s.panel}>
          <Text style={s.label}>
            {new Date(entry.finishedAt).toLocaleDateString()}
          </Text>
          <Copy>
            {winners(entry.game)
              .map((p) => p.name)
              .join(" & ")}{" "}
            {winners(entry.game).length > 1 ? "share the win!" : "wins!"}
          </Copy>
          {entry.game.players.map((p) => (
            <View key={p.id} style={s.row}>
              <Avatar
                index={entry.seats.find((s) => s.id === p.id)?.avatar ?? 0}
                size={48}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.label}>
                  {p.name} · {totals(p.scores).total} pts
                </Text>
                <Text style={s.muted}>
                  Top {totals(p.scores).upper} + bonus {totals(p.scores).bonus}{" "}
                  + bottom {totals(p.scores).lower}
                </Text>
              </View>
            </View>
          ))}
          <Button
            title="Play again with this crew →"
            onPress={() => {
              prepareRematch(entry.seats.map((s) => ({ ...s })));
              router.push("/setup");
            }}
          />
          {session && (
            <Button
              title={
                cloud.some((e) => e.id === entry.id)
                  ? "Backed up ✓"
                  : "Back up to my account"
              }
              disabled={busy || cloud.some((e) => e.id === entry.id)}
              onPress={() => void backup(entry)}
            />
          )}
        </View>
      ))}
      {!session && (
        <Button
          title="Sign in for cloud backups →"
          secondary
          onPress={() => router.push("/online")}
        />
      )}
      <Copy>
        Up to 100 recent local games are kept. Local backups are personal
        records.
      </Copy>
      <Button title="Home" secondary onPress={() => router.replace("/")} />
    </Page>
  );
}
