import { CATEGORIES, Category, Dice, commitScore, createGame, rollDice, round, score, toggleHold, totals, winners } from './engine';

const setup = () => createGame([{ id: 'a', name: 'Ben' }, { id: 'b', name: 'Guest' }]);

test.each<[Category, Dice, number]>([
  ['ones', [1, 1, 3, 4, 5], 2], ['twos', [2, 2, 3, 4, 5], 4],
  ['threes', [3, 3, 3, 4, 5], 9], ['fours', [4, 4, 3, 4, 5], 12],
  ['fives', [5, 5, 3, 4, 5], 15], ['sixes', [6, 6, 3, 4, 5], 12],
  ['threeOfAKind', [3, 3, 3, 4, 5], 18], ['threeOfAKind', [1, 2, 3, 4, 5], 0],
  ['fourOfAKind', [6, 6, 6, 6, 1], 25], ['fourOfAKind', [6, 6, 6, 1, 1], 0],
  ['fullHouse', [2, 2, 3, 3, 3], 25], ['fullHouse', [3, 3, 3, 3, 3], 0],
  ['smallStraight', [4, 2, 2, 3, 1], 30], ['smallStraight', [3, 4, 5, 6, 6], 30],
  ['smallStraight', [1, 2, 4, 5, 6], 0], ['largeStraight', [6, 3, 4, 2, 5], 40],
  ['largeStraight', [1, 2, 3, 4, 4], 0], ['yahtzee', [2, 2, 2, 2, 2], 50],
  ['yahtzee', [2, 2, 2, 2, 1], 0], ['chance', [1, 2, 3, 4, 5], 15],
])('%s scores %j as %s', (category, dice, expected) => {
  const original = [...dice];
  expect(score(category, dice)).toBe(expected);
  expect(dice).toEqual(original);
});

test('upper bonus threshold and totals', () => {
  expect(totals({ sixes: 30, fives: 25, fours: 8, chance: 20 }))
    .toEqual({ upper: 63, lower: 20, bonus: 35, total: 118 });
  expect(totals({ sixes: 30, fives: 25, fours: 7 }).bonus).toBe(0);
});

test('holds preserve values, zero random generates one, and a fourth roll is rejected', () => {
  const initial = setup();
  expect(() => toggleHold(initial, 0)).toThrow();
  const first = rollDice(initial, () => 0);
  const held = toggleHold(first, 0);
  const second = rollDice(held, () => 0.999);
  expect(second.dice).toEqual([1, 6, 6, 6, 6]);
  expect(first.held).toEqual([false, false, false, false, false]);
  expect(initial.dice).toBeNull();
  expect(() => rollDice(rollDice(second))).toThrow('No rolls');
  expect(() => toggleHold(first, 5)).toThrow();
  expect(() => toggleHold(first, 1.5)).toThrow();
  expect(() => rollDice(initial, () => 1)).toThrow();
  expect(() => rollDice(initial, () => NaN)).toThrow();
});

test('commit permits zero, rotates players, resets dice, and prevents reuse', () => {
  const initial = setup();
  expect(() => commitScore(initial, 'ones')).toThrow();
  const next = commitScore(toggleHold(rollDice(initial, () => 0.99), 0), 'ones');
  expect(next.players[0].scores.ones).toBe(0);
  expect(initial.players[0].scores).toEqual({});
  expect(next.currentPlayer).toBe(1);
  expect(next.dice).toBeNull();
  expect(next.rolls).toBe(0);
  expect(next.held.every(h => !h)).toBe(true);
  expect(round(next)).toBe(1);
  const back = commitScore(rollDice(next, () => 0), 'ones');
  expect(round(back)).toBe(2);
  expect(() => commitScore(rollDice(back), 'ones')).toThrow('already used');
});

test('complete two-player game returns tied winners and rejects further moves', () => {
  let game = setup();
  expect(winners(game)).toEqual([]);
  for (const category of CATEGORIES) {
    for (let i = 0; i < 2; i++) game = commitScore(rollDice(game, () => 0), category);
  }
  expect(game.status).toBe('complete');
  expect(round(game)).toBe(13);
  expect(winners(game).map(p => p.id)).toEqual(['a', 'b']);
  expect(() => rollDice(game)).toThrow('complete');
  expect(() => toggleHold(game, 0)).toThrow('complete');
  expect(() => commitScore(game, 'chance')).toThrow('complete');
});

test('solo game completes and player identities are validated', () => {
  let game = createGame([{ id: 'solo', name: ' Solo ' }]);
  for (const category of CATEGORIES) game = commitScore(rollDice(game, () => 0), category);
  expect(winners(game)[0].name).toBe('Solo');
  expect(() => createGame([])).toThrow();
  expect(() => createGame([{ id: 'x', name: ' ' }])).toThrow();
  expect(() => createGame([{ id: 'x', name: 'A' }, { id: 'x', name: 'B' }])).toThrow();
});
