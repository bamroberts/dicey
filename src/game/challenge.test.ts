import { applyOnlineMove } from './engine';
import { createGame } from './engine';
const game = () => createGame([{ id: 'host', name: 'Ben' }, { id: 'guest', name: 'Mia' }]);
test('only the current participant can move', () => {
  expect(() => applyOnlineMove(game(), 'outsider', { kind: 'roll' }, () => 0)).toThrow('not your turn');
  expect(() => applyOnlineMove(game(), 'guest', { kind: 'roll' }, () => 0)).toThrow('not your turn');
});
test('server rolls, holds, scores, and rotates using the existing rules', () => {
  const first = applyOnlineMove(game(), 'host', { kind: 'roll' }, () => 0);
  const held = applyOnlineMove(first, 'host', { kind: 'hold', index: 0 }, () => 0);
  const second = applyOnlineMove(held, 'host', { kind: 'roll' }, () => 0.99);
  expect(second.dice).toEqual([1, 6, 6, 6, 6]);
  const next = applyOnlineMove(second, 'host', { kind: 'score', category: 'fourOfAKind' }, () => 0);
  expect(next.players[0].scores.fourOfAKind).toBe(25);
  expect(() => applyOnlineMove(next, 'host', { kind: 'roll' }, () => 0)).toThrow('not your turn');
  expect(applyOnlineMove(next, 'guest', { kind: 'roll' }, () => 0).rolls).toBe(1);
});
