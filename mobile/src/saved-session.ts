import { CATEGORIES, Game } from "../../src/game/engine";
export type Seat = { id: string; name: string; avatar: number };
export type SavedSession = {
  version: 1;
  game: Game | null;
  seats: Seat[];
  handoff: boolean;
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
/** Reject incompatible or inconsistent saves instead of passing untrusted data to the engine. */
export function decodeSession(raw: string): SavedSession {
  const data: unknown = JSON.parse(raw);
  if (
    !object(data) ||
    data.version !== 1 ||
    typeof data.handoff !== "boolean" ||
    !Array.isArray(data.seats) ||
    data.seats.length < 2 ||
    data.seats.length > 4
  )
    throw new Error("Unsupported save");
  if (
    !data.seats.every(
      (p) =>
        object(p) &&
        typeof p.id === "string" &&
        p.id.trim() &&
        typeof p.name === "string" &&
        p.name.trim() &&
        p.name.length <= 20 &&
        integer(p.avatar, 0, 5),
    ) ||
    new Set(data.seats.map((p) => p.id)).size !== data.seats.length
  )
    throw new Error("Invalid players");
  if (data.game === null) {
    if (data.handoff) throw new Error("Invalid handoff");
    return data as SavedSession;
  }
  const g = data.game;
  if (
    !object(g) ||
    g.ruleset !== "prototype-v1" ||
    !Array.isArray(g.players) ||
    g.players.length < 2 ||
    g.players.length > 4 ||
    !integer(g.currentPlayer, 0, g.players.length - 1) ||
    !integer(g.rolls, 0, 3) ||
    !["playing", "complete"].includes(g.status as string) ||
    !Array.isArray(g.held) ||
    g.held.length !== 5 ||
    !g.held.every((h) => typeof h === "boolean")
  )
    throw new Error("Invalid game");
  if (
    g.dice !== null &&
    (!Array.isArray(g.dice) ||
      g.dice.length !== 5 ||
      !g.dice.every((d) => integer(d, 1, 6)))
  )
    throw new Error("Invalid dice");
  if (
    (g.rolls === 0) !== (g.dice === null) ||
    (g.dice === null && g.held.some(Boolean))
  )
    throw new Error("Invalid turn");
  for (const p of g.players) {
    if (
      !object(p) ||
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      !data.seats.some((s) => s.id === p.id) ||
      !object(p.scores)
    )
      throw new Error("Invalid scorecard");
    for (const [category, value] of Object.entries(p.scores)) {
      const index = CATEGORIES.indexOf(category as (typeof CATEGORIES)[number]);
      if (index < 0 || !integer(value, 0, index < 6 ? (index + 1) * 5 : 50))
        throw new Error("Invalid score");
      if (index < 6 && (value as number) % (index + 1) !== 0)
        throw new Error("Invalid upper score");
      const fixed = (
        {
          fullHouse: 25,
          smallStraight: 30,
          largeStraight: 40,
          yahtzee: 50,
        } as Record<string, number>
      )[category];
      if (fixed && value !== 0 && value !== fixed)
        throw new Error("Invalid combination score");
      if (
        ["chance", "threeOfAKind", "fourOfAKind"].includes(category) &&
        ((value as number) > 30 ||
          (category === "chance" && (value as number) < 5))
      )
        throw new Error("Invalid sum");
    }
  }
  if (new Set(g.players.map((p) => p.id)).size !== g.players.length)
    throw new Error("Duplicate players");
  const counts = g.players.map((p) => Object.keys(p.scores).length);
  const finished = counts.every((n) => n === 13);
  if (
    (g.status === "complete") !== finished ||
    (finished && (g.rolls !== 0 || data.handoff))
  )
    throw new Error("Invalid completion");
  if (
    !finished &&
    !counts.every(
      (n, i) =>
        n ===
        counts[g.currentPlayer as number] +
          (i < (g.currentPlayer as number) ? 1 : 0),
    )
  )
    throw new Error("Invalid player rotation");
  if (data.handoff && g.rolls !== 0) throw new Error("Invalid handoff");
  return data as SavedSession;
}
