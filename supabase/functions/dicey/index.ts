import { createClient } from 'npm:@supabase/supabase-js@2';
import { Game, Move, createGame, applyOnlineMove } from '../../../src/game/engine.ts';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (data: unknown, status = 200) => Response.json(data, { status, headers });
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function profile(body: Record<string, unknown>) {
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 20 || !Number.isInteger(body.avatar) || Number(body.avatar) < 0 || Number(body.avatar) > 5) throw new Error('Choose a name and avatar');
  return { name: body.name.trim(), avatar: Number(body.avatar) };
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!;
  const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!);
  const token = req.headers.get('Authorization')?.replace(/^Bearer /i, '');
  if (!token) return json({ error: 'Sign in to play online' }, 401);
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user) return json({ error: 'Sign in again to continue' }, 401);
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') throw new Error('Invalid request');
    const actor = user.id;
    if (body.action === 'list') {
      const { data, error } = await admin.from('dicey_matches').select('*').or(`host_id.eq.${actor},guest_id.eq.${actor}`).order('updated_at', { ascending: false }).limit(100);
      if (error) throw error; return json({ matches: data });
    }
    if (body.action === 'create') {
      if (!uuid(body.requestId)) throw new Error('Invalid request ID');
      const p = profile(body);
      const { error } = await admin.from('dicey_matches').upsert({ id: body.requestId, host_id: actor, host_name: p.name, host_avatar: p.avatar, invite_code: crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase() }, { onConflict: 'id', ignoreDuplicates: true });
      if (error) throw error;
      const { data } = await admin.from('dicey_matches').select('*').eq('id', body.requestId).eq('host_id', actor).single();
      if (!data) throw new Error('Unable to create invitation'); return json({ match: data });
    }
    const joining = body.action === 'join';
    if (joining && (typeof body.code !== 'string' || !/^[A-F0-9]{16}$/i.test(body.code))) throw new Error('Enter the 16-character invitation code');
    if (!joining && !uuid(body.matchId)) throw new Error('Invalid match ID');
    const query = admin.from('dicey_matches').select('*');
    const { data: match, error } = await (joining ? query.eq('invite_code', body.code.toUpperCase()) : query.eq('id', body.matchId)).single();
    if (error || !match) return json({ error: 'Challenge not found' }, 404);
    if (!joining && match.host_id !== actor && match.guest_id !== actor) return json({ error: 'Challenge not found' }, 404);
    if (body.action === 'get') return json({ match });
    if (!uuid(body.requestId)) throw new Error('Invalid request ID');
    // A response lost after commit must be safe to retry, even after turn rotation.
    const { data: receipt } = await admin.from('dicey_move_receipts').select('result').eq('match_id', match.id).eq('request_id', body.requestId).eq('actor_id', actor).maybeSingle();
    if (receipt) return json({ match: receipt.result });
    let state: Game;
    let guest: { p_guest: string; p_name: string; p_avatar: number } | undefined;
    if (joining) {
      if (match.guest_id === actor) return json({ match });
      if (match.status !== 'waiting' || match.host_id === actor || Date.parse(match.expires_at) < Date.now()) throw new Error('Invitation is unavailable or expired');
      const p = profile(body);
      state = createGame([{ id: match.host_id, name: match.host_name }, { id: actor, name: p.name }]);
      guest = { p_guest: actor, p_name: p.name, p_avatar: p.avatar };
    } else {
      if (body.action !== 'move' || !Number.isInteger(body.revision) || body.revision !== match.revision) return json({ error: 'The game changed. Refresh before playing.', stale: true }, 409);
      state = match.state as Game;
      if (!state || state.status !== 'playing' || state.players[state.currentPlayer].id !== actor) throw new Error('It is not your turn');
      if (!body.move || typeof body.move !== 'object') throw new Error('Invalid move');
      state = applyOnlineMove(state, actor, body.move as Move, () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296);
    }
    const { data: result, error: commitError } = await admin.rpc('dicey_commit_move', { p_match: match.id, p_request: body.requestId, p_actor: actor, p_revision: match.revision, p_state: state, ...guest });
    if (commitError) {
      if (commitError.message.includes('STALE_REVISION')) return json({ error: 'The game changed. Refresh before playing.', stale: true }, 409);
      throw commitError;
    }
    return json({ match: result });
  } catch (error) {
    console.error('Dicey request failed', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: error instanceof Error ? error.message : 'Could not complete the request' }, 400);
  }
});
