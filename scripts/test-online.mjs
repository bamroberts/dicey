/** Integration test against this repo's disposable LOCAL Supabase stack only. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(new URL('../mobile/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');
const config = JSON.parse(execFileSync('npx', ['--yes', 'supabase', 'status', '--output', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const url = config.API_URL;
assert.match(url, /^http:\/\/(127\.0\.0\.1|localhost):56321$/);
const admin = createClient(url, config.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const users = []; const matches = [];
async function call(token, body) {
  const response = await fetch(`${url}/functions/v1/dicey`, { method: 'POST', headers: { apikey: config.ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json(); return { status: response.status, ...data };
}
try {
  for (let i = 0; i < 3; i++) {
    const email = `dicey-${randomUUID()}@example.test`; const password = randomUUID();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
    const client = createClient(url, config.ANON_KEY, { auth: { persistSession: false } });
    const { data: login, error: loginError } = await client.auth.signInWithPassword({ email, password }); if (loginError) throw loginError;
    users.push({ id: data.user.id, token: login.session.access_token, client });
  }
  const [host, guest, outsider] = users;
  assert.equal((await call(config.ANON_KEY, { action: 'list' })).status, 401);
  const requestId = randomUUID();
  const created = await call(host.token, { action: 'create', requestId, name: 'Host', avatar: 0 });
  assert.equal(created.status, 200, JSON.stringify(created)); let match = created.match; matches.push(match.id);
  assert.equal((await call(host.token, { action: 'create', requestId, name: 'Host', avatar: 0 })).match.id, match.id);
  assert.equal((await call(outsider.token, { action: 'get', matchId: match.id })).status, 404);
  assert.deepEqual((await outsider.client.from('dicey_matches').select('*').eq('id', match.id)).data, []);
  const blockedWrite = await guest.client.from('dicey_matches').insert({ id: randomUUID(), host_id: guest.id, host_name: 'Cheat', host_avatar: 0, invite_code: randomUUID() });
  assert.ok(blockedWrite.error, 'clients cannot bypass authoritative moves');
  const joined = await call(guest.token, { action: 'join', requestId: randomUUID(), code: match.invite_code, name: 'Guest', avatar: 1 });
  assert.equal(joined.status, 200, JSON.stringify(joined)); match = joined.match;
  const duplicate = { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'roll' } };
  const [a, b] = await Promise.all([call(host.token, duplicate), call(host.token, duplicate)]);
  assert.equal(a.status, 200, JSON.stringify(a)); assert.equal(b.status, 200, JSON.stringify(b)); assert.deepEqual(a.match.state, b.match.state); assert.equal(a.match.state.rolls, 1); match = a.match;
  assert.equal((await call(host.token, { ...duplicate, requestId: randomUUID() })).status, 409);
  assert.equal((await call(guest.token, { ...duplicate, requestId: randomUUID(), revision: match.revision })).status, 400);
  const raceBody = { ...duplicate, revision: match.revision };
  const raced = await Promise.all([call(host.token, { ...raceBody, requestId: randomUUID() }), call(host.token, { ...raceBody, requestId: randomUUID() })]);
  assert.deepEqual(raced.map(r => r.status).sort(), [200, 409]); match = raced.find(r => r.status === 200).match;
  assert.equal(match.state.rolls, 2);
  const hold = { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'hold', index: 0 } };
  const held = await call(host.token, hold); const heldAgain = await call(host.token, hold);
  assert.equal(held.status, 200); assert.deepEqual(held.match, heldAgain.match); assert.equal(held.match.state.held[0], true); match = held.match;
  const lastRoll = await call(host.token, { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'roll' } });
  assert.equal(lastRoll.status, 200); assert.equal(lastRoll.match.state.dice[0], match.state.dice[0]); match = lastRoll.match;
  assert.equal((await call(host.token, { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'roll' } })).status, 400);
  const bypass = await host.client.rpc('dicey_commit_move', { p_match: match.id, p_request: randomUUID(), p_actor: host.id, p_revision: match.revision, p_state: match.state });
  assert.ok(bypass.error, 'clients cannot call the privileged commit RPC');
  const categories = ['ones','twos','threes','fours','fives','sixes','threeOfAKind','fourOfAKind','fullHouse','smallStraight','largeStraight','yahtzee','chance'];
  let turns = 0;
  while (match.status !== 'complete') {
    const actor = users.find(u => u.id === match.state.players[match.state.currentPlayer].id);
    if (!match.state.dice) {
      const rolled = await call(actor.token, { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'roll' } }); assert.equal(rolled.status, 200, JSON.stringify(rolled)); match = rolled.match;
    }
    const player = match.state.players[match.state.currentPlayer]; const category = categories.find(c => player.scores[c] === undefined);
    const scored = await call(actor.token, { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'score', category } }); assert.equal(scored.status, 200, JSON.stringify(scored)); match = scored.match; turns++;
    assert.ok(turns <= 26);
  }
  assert.equal(turns, 26); assert.ok(match.state.players.every(p => Object.keys(p.scores).length === 13));
  assert.equal((await call(host.token, { action: 'move', matchId: match.id, requestId: randomUUID(), revision: match.revision, move: { kind: 'roll' } })).status, 400);
  // Both devices see the same final state; an outsider still sees nothing.
  assert.deepEqual((await call(guest.token, { action: 'get', matchId: match.id })).match.state, match.state);
  assert.equal((await call(outsider.token, { action: 'list' })).matches.length, 0);
  const historyId = randomUUID();
  const { error: backupError } = await host.client.from('dicey_local_history').insert({ game_id: historyId, finished_at: new Date().toISOString(), snapshot: { game: match.state } }); assert.equal(backupError, null);
  assert.deepEqual((await guest.client.from('dicey_local_history').select('*')).data, []);
  assert.ok((await guest.client.from('dicey_local_history').insert({ owner_id: host.id, game_id: randomUUID(), finished_at: new Date().toISOString(), snapshot: { game: match.state } })).error);
  console.log('PASS: two-player complete game, duplicate/concurrent requests, stale moves, turn ownership, match RLS, and private history backups');
} finally {
  for (const id of matches) await admin.from('dicey_matches').delete().eq('id', id);
  for (const user of users) { await admin.from('dicey_local_history').delete().eq('owner_id', user.id); await admin.auth.admin.deleteUser(user.id); }
}
