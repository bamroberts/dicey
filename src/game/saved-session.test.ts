import { createGame, rollDice, toggleHold, commitScore, CATEGORIES } from './engine';
import { decodeSession } from '../../mobile/src/saved-session';
const seats = [{ id: 'p1', name: 'Ben', avatar: 4 }, { id: 'p2', name: 'Mia', avatar: 5 }];
const saved = () => ({ version: 1, seats, handoff: false, game: createGame(seats) });
test('restores rolled dice and holds exactly', () => {
  const data = saved(); data.game = toggleHold(rollDice(data.game, () => 0.5), 2);
  expect(decodeSession(JSON.stringify(data))).toEqual(data);
});
test('restores handoff, zero scores and complete games', () => {
  const data = saved(); data.game = commitScore(rollDice(data.game, () => 0.99), 'ones'); data.handoff = true;
  expect(decodeSession(JSON.stringify(data))).toEqual(data);
  const final = saved();
  for (const category of CATEGORIES) for (let i = 0; i < 2; i++) final.game = commitScore(rollDice(final.game, () => 0), category);
  expect(decodeSession(JSON.stringify(final))).toEqual(final);
});
test.each([
  { version: 2 }, { seats: [] }, { handoff: true, game: rollDice(saved().game, () => 0) },
  { game: { ...saved().game, currentPlayer: 4 } },
  { game: { ...saved().game, rolls: 1 } },
  { game: { ...saved().game, status: 'complete' } },
  { game: { ...saved().game, held: [true, false, false, false, false] } },
  { game: { ...saved().game, rolls: 1, dice: [0, 1, 2, 3, 4] } },
  { game: { ...saved().game, players: [{ ...saved().game.players[0], scores: { fullHouse: 24 } }, saved().game.players[1]] } },
])('rejects inconsistent saves %j', patch => {
  expect(() => decodeSession(JSON.stringify({ ...saved(), ...patch }))).toThrow();
});
test('rejects corrupt JSON and accepts cleared sessions', () => {
  expect(() => decodeSession('{')).toThrow();
  expect(decodeSession(JSON.stringify({ ...saved(), game: null })).game).toBeNull();
});
