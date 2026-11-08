import type { Challenge } from "./lib/challenges";
export function challengeStatus(
  match: Challenge,
  userId: string,
  now = Date.now(),
): string {
  if (match.status === "cancelled") return "Invitation cancelled";
  if (match.status === "complete") return "Game complete";
  if (match.status === "waiting") {
    if (Date.parse(match.expires_at) < now) return "Invitation expired";
    if (match.invited_id === userId)
      return `${match.host_name} wants a rematch!`;
    return match.invited_name
      ? `Waiting for ${match.invited_name}`
      : "Waiting for a friend";
  }
  const active = match.state?.players[match.state.currentPlayer];
  return active?.id === userId
    ? "Your turn!"
    : `${active?.name ?? "Your opponent"}’s turn`;
}
export function challengeRank(
  match: Challenge,
  userId: string,
  now = Date.now(),
): number {
  if (match.status === "playing")
    return match.state?.players[match.state.currentPlayer].id === userId
      ? 0
      : 2;
  if (match.status === "waiting" && Date.parse(match.expires_at) >= now)
    return match.invited_id === userId ? 1 : 3;
  return match.status === "complete" ? 4 : 5;
}
