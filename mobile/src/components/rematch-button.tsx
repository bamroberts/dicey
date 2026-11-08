import { useRef, useState } from "react";
import { router } from "expo-router";
import { randomUUID } from "expo-crypto";
import { Button, Copy } from "./ui";
import { challengeRequest } from "../lib/challenges";
export function RematchButton({ matchId }: { matchId: string }) {
  const [requestId] = useState(() => randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  async function challenge() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const { match } = await challengeRequest({
        action: "rematch",
        matchId,
        requestId,
      });
      if (match)
        router.push({ pathname: "/challenge", params: { id: match.id } });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send the rematch challenge",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        title={
          busy
            ? "Challenging…"
            : error
              ? "Retry rematch challenge →"
              : "Challenge a rematch →"
        }
        disabled={busy}
        onPress={() => void challenge()}
      />
      {error && <Copy>{error}</Copy>}
    </>
  );
}
