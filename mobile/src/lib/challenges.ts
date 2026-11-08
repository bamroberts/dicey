import type { Game, Move } from "../../../src/game/engine";
import { supabase } from "./supabase";
export type Challenge = {
  id: string;
  host_id: string;
  guest_id: string | null;
  host_name: string;
  guest_name: string | null;
  host_avatar: number;
  guest_avatar: number | null;
  invite_code: string;
  invited_id: string | null;
  invited_name: string | null;
  invited_avatar: number | null;
  rematch_of: string | null;
  status: "waiting" | "playing" | "complete" | "cancelled";
  state: Game | null;
  revision: number;
  updated_at: string;
  expires_at: string;
};
export type ChallengeRequest =
  | { action: "list" }
  | { action: "create"; requestId: string; name: string; avatar: number }
  | {
      action: "join";
      requestId: string;
      code: string;
      name: string;
      avatar: number;
    }
  | { action: "get"; matchId: string }
  | { action: "rematch"; matchId: string; requestId: string }
  | { action: "cancel"; matchId: string; requestId: string; revision: number }
  | {
      action: "move";
      requestId: string;
      matchId: string;
      revision: number;
      move: Move;
    };
export async function challengeRequest(
  body: ChallengeRequest,
): Promise<{ match?: Challenge; matches?: Challenge[] }> {
  if (!supabase) throw new Error("Online play is not configured");
  const { data, error } = await supabase.functions.invoke("dicey", {
    body,
    timeout: 15000,
  });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(
      details?.error ??
        "Could not reach the game server. Check your connection and retry.",
    );
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
