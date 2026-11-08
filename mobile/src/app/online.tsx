import { parseEmailProof } from "../auth-input";
import { useNow } from "../hooks/use-now";
import { challengeRank, challengeStatus } from "../challenge-status";
import { useCallback, useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import { Pressable, Text, View } from "react-native";
import { Avatar, Button, Copy, Heading, Page, s } from "../components/ui";
import { Field } from "../components/field";
import { useOnline } from "../online-context";
import { supabase } from "../lib/supabase";
import {
  Challenge,
  challengeRequest,
  ChallengeRequest,
} from "../lib/challenges";
import { colors as c, avatars } from "../theme";
export default function Online() {
  const { session } = useOnline();
  return <OnlineBody key={session?.user.id ?? "offline"} />;
}
function OnlineBody() {
  const now = useNow();
  const { session, ready } = useOnline();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [code, setCode] = useState("");
  const [matches, setMatches] = useState<Challenge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  // Keep the same creation/join request after a transport failure.
  const [pending, setPending] = useState<ChallengeRequest | null>(null);
  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const data = await challengeRequest({ action: "list" });
      setMatches(data.matches ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load challenges");
    }
  }, [session]);
  useEffect(() => {
    if (!session) return;
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [session, refresh]);
  async function run(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function submit(request: ChallengeRequest) {
    setPending(request);
    const result = await challengeRequest(request);
    setPending(null);
    if (result.match)
      router.push({ pathname: "/challenge", params: { id: result.match.id } });
  }
  if (!supabase)
    return (
      <Page>
        <Heading>Challenge friends</Heading>
        <Copy>
          Online play is being connected. You can still play together offline
          and record your games.
        </Copy>
        <Button
          title="Game history →"
          onPress={() => router.push("/history")}
        />
        <Button title="Home" secondary onPress={() => router.replace("/")} />
      </Page>
    );
  if (!ready)
    return (
      <Page>
        <Copy>Checking your account…</Copy>
      </Page>
    );
  if (!session)
    return (
      <Page>
        <Heading>Your next rival awaits</Heading>
        <Copy>Sign in by email to pick up your challenges on any device.</Copy>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!sent && !busy}
        />
        <Button
          title={
            busy
              ? "Please wait…"
              : sent
                ? "Send another email"
                : "Send sign-in email"
          }
          disabled={busy || !email.trim()}
          onPress={() =>
            void run(async () => {
              const { error } = await supabase!.auth.signInWithOtp({
                email: email.trim(),
              });
              if (error) throw error;
              setSent(true);
            })
          }
        />
        {sent && (
          <>
            <Copy>
              Copy the sign-in link from your email and paste it below. If the
              email includes a numeric code, you can use that instead.
            </Copy>
            <Field
              label="Email code or sign-in link"
              value={token}
              onChangeText={setToken}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={4096}
            />
            <Button
              title="Sign in →"
              disabled={busy || token.length < 6}
              onPress={() =>
                void run(async () => {
                  const proof = parseEmailProof(
                    token,
                    process.env.EXPO_PUBLIC_SUPABASE_URL!,
                  );
                  const { error } = await supabase!.auth.verifyOtp(
                    "token" in proof
                      ? {
                          email: email.trim(),
                          token: proof.token,
                          type: "email",
                        }
                      : { token_hash: proof.token_hash, type: "email" },
                  );
                  if (error) throw error;
                })
              }
            />
            <Button
              title="Use another email"
              secondary
              disabled={busy}
              onPress={() => {
                setSent(false);
                setToken("");
              }}
            />
          </>
        )}
        {error && <Copy>{error}</Copy>}
        <Button title="Home" secondary onPress={() => router.replace("/")} />
      </Page>
    );
  return (
    <Page>
      <Heading>Challenge friends</Heading>
      <Copy>
        Two players. Take your turn, then come back when it’s yours again.
      </Copy>
      {error && <Copy>{error}</Copy>}
      {pending && (
        <>
          <Button
            title="Retry last request"
            disabled={busy}
            onPress={() => void run(() => submit(pending))}
          />
          <Button
            title="Dismiss failed request"
            secondary
            disabled={busy}
            onPress={() => setPending(null)}
          />
        </>
      )}
      <View style={s.panel}>
        <Field
          label="Your player name"
          value={name}
          onChangeText={setName}
          maxLength={20}
        />
        <View style={s.wrap}>
          {avatars.map((label, i) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${label}`}
              accessibilityState={{ selected: i === avatar }}
              onPress={() => setAvatar(i)}
              style={{
                borderWidth: 2,
                borderColor: i === avatar ? c.mint : "transparent",
                borderRadius: 30,
                padding: 2,
              }}
            >
              <Avatar index={i} size={48} />
            </Pressable>
          ))}
        </View>
        <Button
          title="Create a challenge →"
          disabled={busy || !name.trim() || !!pending}
          onPress={() =>
            void run(() =>
              submit({
                action: "create",
                requestId: randomUUID(),
                name: name.trim(),
                avatar,
              }),
            )
          }
        />
        <Field
          label="Friend's invitation code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={16}
        />
        <Button
          title="Join challenge →"
          secondary
          disabled={
            busy || !name.trim() || code.trim().length !== 16 || !!pending
          }
          onPress={() =>
            void run(() =>
              submit({
                action: "join",
                requestId: randomUUID(),
                code: code.trim().toUpperCase(),
                name: name.trim(),
                avatar,
              }),
            )
          }
        />
      </View>
      <Text style={s.label}>Your challenges</Text>
      <Copy>
        {
          matches.filter(
            (m) =>
              m.status === "playing" &&
              m.state?.players[m.state.currentPlayer].id === session.user.id,
          ).length
        }{" "}
        games waiting for your turn
      </Copy>
      <Button
        title="Refresh challenges"
        secondary
        disabled={busy}
        onPress={() => void refresh()}
      />
      {matches.length === 0 && <Copy>No challenges yet. Start a rivalry!</Copy>}
      {[...matches]
        .sort(
          (a, b) =>
            challengeRank(a, session.user.id, now) -
              challengeRank(b, session.user.id, now) ||
            b.updated_at.localeCompare(a.updated_at),
        )
        .map((match) => (
          <View style={s.panel} key={match.id}>
            <Text style={s.label}>
              {match.host_name} vs{" "}
              {match.guest_name ?? match.invited_name ?? "a friend"}
            </Text>
            <Copy>{challengeStatus(match, session.user.id, now)}</Copy>
            <Button
              title="Open challenge →"
              onPress={() =>
                router.push({
                  pathname: "/challenge",
                  params: { id: match.id },
                })
              }
            />
          </View>
        ))}
      <Button
        title="Sign out"
        secondary
        disabled={busy || !!pending}
        onPress={() =>
          void run(async () => {
            await supabase!.auth.signOut();
            setMatches([]);
          })
        }
      />
      <Button title="Home" secondary onPress={() => router.replace("/")} />
    </Page>
  );
}
