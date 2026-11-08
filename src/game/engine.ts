/** Provisional rules preserved from the prototype; see docs/PLAN.md. */
export const CATEGORIES = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
  'threeOfAKind', 'fourOfAKind', 'fullHouse', 'smallStraight',
  'largeStraight', 'yahtzee', 'chance',
] as const;
export type Category = typeof CATEGORIES[number];
export type Face = 1 | 2 | 3 | 4 | 5 | 6;
export type Dice = readonly [Face, Face, Face, Face, Face];
export type Scorecard = Partial<Record<Category, number>>;
export interface Player { id: string; name: string; scores: Scorecard }
export interface Game {
  ruleset: 'prototype-v1';
  players: readonly Player[];
  currentPlayer: number;
  dice: Dice | null;
  held: readonly boolean[];
  rolls: number;
  status: 'playing' | 'complete';
}

export function score(category: Category, dice: Dice): number {
  if (!CATEGORIES.includes(category)) throw new Error('Unknown category');
  if (dice.length !== 5 || dice.some(d => !Number.isInteger(d) || d < 1 || d > 6)) {
    throw new Error('Expected five dice with values 1–6');
  }
  const upper = CATEGORIES.indexOf(category);
  if (upper < 6) return dice.filter(d => d === upper + 1).reduce((a, d) => a + d, 0);
  const counts = Object.values(dice.reduce<Record<number, number>>((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {}));
  const sum = dice.reduce<number>((a, d) => a + d, 0);
  const run = (length: number) => [1, 2, 3].some(start =>
    start + length - 1 <= 6 && Array.from({ length }, (_, i) => start + i)
      .every(value => dice.some(d => d === value)));
  switch (category) {
    case 'threeOfAKind': return counts.some(n => n >= 3) ? sum : 0;
    case 'fourOfAKind': return counts.some(n => n >= 4) ? sum : 0;
    case 'fullHouse': return counts.includes(3) && counts.includes(2) ? 25 : 0;
    case 'smallStraight': return run(4) ? 30 : 0;
    case 'largeStraight': return run(5) ? 40 : 0;
    case 'yahtzee': return counts.includes(5) ? 50 : 0;
    case 'chance': return sum;
    default: throw new Error('Unknown category');
  }
}

export function totals(scores: Scorecard) {
  const upper = CATEGORIES.slice(0, 6).reduce((sum, c) => sum + (scores[c] ?? 0), 0);
  const lower = CATEGORIES.slice(6).reduce((sum, c) => sum + (scores[c] ?? 0), 0);
  const bonus = upper >= 63 ? 35 : 0;
  return { upper, lower, bonus, total: upper + lower + bonus };
}

export function createGame(players: readonly { id: string; name: string }[]): Game {
  if (!players.length || players.some(p => !p.id.trim() || !p.name.trim()) ||
      new Set(players.map(p => p.id)).size !== players.length) {
    throw new Error('Provide players with unique IDs and nonempty names');
  }
  return {
    ruleset: 'prototype-v1', players: players.map(p => ({ ...p, name: p.name.trim(), scores: {} })),
    currentPlayer: 0, dice: null, held: Array(5).fill(false), rolls: 0, status: 'playing',
  };
}

function requirePlaying(game: Game) {
  if (game.status !== 'playing') throw new Error('Game is complete');
}

export function rollDice(game: Game, random: () => number = Math.random): Game {
  requirePlaying(game);
  if (game.rolls >= 3) throw new Error('No rolls remaining');
  const dice = Array.from({ length: 5 }, (_, i) => {
    if (game.held[i] && game.dice) return game.dice[i];
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Invalid random value');
    return Math.floor(value * 6) + 1;
  }) as unknown as Dice;
  return { ...game, dice, rolls: game.rolls + 1 };
}

export function toggleHold(game: Game, index: number): Game {
  requirePlaying(game);
  if (!game.dice) throw new Error('Roll before holding dice');
  if (!Number.isInteger(index) || index < 0 || index > 4) throw new Error('Invalid die index');
  return { ...game, held: game.held.map((held, i) => i === index ? !held : held) };
}

export function commitScore(game: Game, category: Category): Game {
  requirePlaying(game);
  if (!game.dice) throw new Error('Roll before scoring');
  const player = game.players[game.currentPlayer];
  if (player.scores[category] !== undefined) throw new Error('Category already used');
  const value = score(category, game.dice);
  const players = game.players.map((p, i) => i === game.currentPlayer
    ? { ...p, scores: { ...p.scores, [category]: value } } : p);
  const complete = players.every(p => CATEGORIES.every(c => p.scores[c] !== undefined));
  return {
    ...game, players, currentPlayer: complete ? game.currentPlayer : (game.currentPlayer + 1) % players.length,
    dice: null, held: Array(5).fill(false), rolls: 0, status: complete ? 'complete' : 'playing',
  };
}

export function winners(game: Game): readonly Player[] {
  if (game.status !== 'complete') return [];
  const highest = Math.max(...game.players.map(p => totals(p.scores).total));
  return game.players.filter(p => totals(p.scores).total === highest);
}

/** One-based round for display; remains 13 on the results screen. */
export function round(game: Game): number {
  return Math.min(13, 1 + Math.min(...game.players.map(p => Object.keys(p.scores).length)));
}

export type Move = { kind: 'roll' } | { kind: 'hold'; index: number } | { kind: 'score'; category: Category };
export function applyOnlineMove(game: Game, actor: string, move: Move, random: () => number): Game {
  if (game.status !== 'playing') throw new Error('Game is complete');
  if (game.players[game.currentPlayer].id !== actor) throw new Error('It is not your turn');
  switch (move.kind) {
    case 'roll': return rollDice(game, random);
    case 'hold': return toggleHold(game, move.index);
    case 'score':
      if (!CATEGORIES.includes(move.category)) throw new Error('Unknown category');
      return commitScore(game, move.category);
    default: throw new Error('Unknown move');
  }
}
