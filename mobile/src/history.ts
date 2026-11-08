import type { Game } from "../../src/game/engine";
import { decodeSession, Seat } from "./saved-session";
export type HistoryEntry = {
  id: string;
  finishedAt: string;
  game: Game;
  seats: Seat[];
};
export function decodeHistory(value: unknown): HistoryEntry[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 100)
    throw new Error("Invalid history");
  return value.map((entry) => {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      typeof entry.finishedAt !== "string" ||
      !Number.isFinite(Date.parse(entry.finishedAt))
    )
      throw new Error("Invalid history entry");
    const saved = decodeSession(
      JSON.stringify({
        version: 1,
        game: entry.game,
        seats: entry.seats,
        handoff: false,
      }),
    );
    if (saved.game?.status !== "complete")
      throw new Error("History must contain completed games");
    return {
      id: entry.id,
      finishedAt: entry.finishedAt,
      game: saved.game,
      seats: saved.seats,
    };
  });
}
export function recordCompleted(
  history: HistoryEntry[],
  id: string,
  game: Game | null,
  seats: Seat[],
  now = new Date().toISOString(),
): HistoryEntry[] {
  if (
    !game ||
    game.status !== "complete" ||
    history.some((entry) => entry.id === id)
  )
    return history;
  return [
    { id, finishedAt: now, game, seats: seats.map((seat) => ({ ...seat })) },
    ...history,
  ].slice(0, 100);
}
