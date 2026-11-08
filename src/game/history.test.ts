import { CATEGORIES, commitScore, createGame, rollDice } from './engine';
import { decodeHistory, recordCompleted } from '../../mobile/src/history';
const seats = [{ id: 'a', name: 'Ben', avatar: 0 }, { id: 'b', name: 'Mia', avatar: 1 }];
const finished = () => { let game = createGame(seats); for (const category of CATEGORIES) for (let i = 0; i < 2; i++) game = commitScore(rollDice(game, () => 0), category); return game; };
test('archives a completed game once and preserves independent rematches', () => {
  const game = finished(); const first = recordCompleted([], 'first', game, seats);
  expect(recordCompleted(first, 'first', game, seats)).toBe(first);
  expect(recordCompleted(first, 'second', game, seats)).toHaveLength(2);
  expect(decodeHistory(JSON.parse(JSON.stringify(first)))).toEqual(first);
  expect(recordCompleted([], 'active', createGame(seats), seats)).toEqual([]);
});
test('keeps newest 100 and rejects incomplete or corrupted results', () => {
  const game = finished(); let history = recordCompleted([], '0', game, seats);
  for (let i = 1; i <= 100; i++) history = recordCompleted(history, String(i), game, seats);
  expect(history).toHaveLength(100); expect(history[0].id).toBe('100');
  expect(() => decodeHistory([{ ...history[0], game: createGame(seats) }])).toThrow();
  expect(() => decodeHistory([{ ...history[0], finishedAt: 'oops' }])).toThrow();
  expect(decodeHistory(undefined)).toEqual([]);
});
