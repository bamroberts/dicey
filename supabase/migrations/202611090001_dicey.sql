-- Dicey tables are namespaced to coexist with other applications.
create table public.dicey_matches (
  id uuid primary key,
  host_id uuid not null references auth.users(id),
  guest_id uuid references auth.users(id),
  invite_code text not null unique,
  host_name text not null check (length(host_name) between 1 and 20),
  guest_name text,
  host_avatar smallint not null check (host_avatar between 0 and 5),
  guest_avatar smallint check (guest_avatar between 0 and 5),
  status text not null default 'waiting' check (status in ('waiting','playing','complete')),
  state jsonb,
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  check (host_id is distinct from guest_id),
  check ((status = 'waiting' and state is null and guest_id is null) or
         (status <> 'waiting' and state is not null and guest_id is not null))
);
create index dicey_matches_host on public.dicey_matches(host_id, updated_at desc);
create index dicey_matches_guest on public.dicey_matches(guest_id, updated_at desc);
alter table public.dicey_matches enable row level security;
create policy "Participants read matches" on public.dicey_matches for select to authenticated
  using ((select auth.uid()) = host_id or (select auth.uid()) = guest_id);
-- No client mutation policy: only the validating Edge Function can write.
revoke all on public.dicey_matches from anon, authenticated;
grant select on public.dicey_matches to authenticated;
grant all on public.dicey_matches to service_role;

create table public.dicey_move_receipts (
  match_id uuid not null references public.dicey_matches(id) on delete cascade,
  request_id uuid not null,
  actor_id uuid not null references auth.users(id),
  result jsonb not null,
  primary key (match_id, request_id)
);
alter table public.dicey_move_receipts enable row level security;
revoke all on public.dicey_move_receipts from anon, authenticated;
grant all on public.dicey_move_receipts to service_role;

-- A lock, revision check, and receipt are committed together. Retrying the
-- same request returns its original result without spending another roll.
create function public.dicey_commit_move(p_match uuid, p_request uuid,
  p_actor uuid, p_revision integer, p_state jsonb,
  p_guest uuid default null, p_name text default null, p_avatar smallint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.dicey_matches; receipt public.dicey_move_receipts; result jsonb;
begin
  select * into m from public.dicey_matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  select * into receipt from public.dicey_move_receipts
    where match_id = p_match and request_id = p_request;
  if found then
    if receipt.actor_id <> p_actor then raise exception 'Request belongs to another player'; end if;
    return receipt.result;
  end if;
  if m.revision <> p_revision then raise exception 'STALE_REVISION'; end if;
  if p_guest is not null then
    if m.status <> 'waiting' or m.host_id = p_actor or p_guest <> p_actor or m.expires_at < now()
      then raise exception 'Invitation unavailable'; end if;
  elsif p_actor is distinct from m.host_id and p_actor is distinct from m.guest_id then
    raise exception 'Not a participant';
  end if;
  update public.dicey_matches set state = p_state,
    status = case when p_state->>'status' = 'complete' then 'complete' else 'playing' end,
    guest_id = coalesce(p_guest, guest_id), guest_name = coalesce(p_name, guest_name),
    guest_avatar = coalesce(p_avatar, guest_avatar), revision = revision + 1,
    updated_at = now() where id = p_match returning to_jsonb(dicey_matches.*) into result;
  insert into public.dicey_move_receipts values (p_match, p_request, p_actor, result);
  return result;
end;
$$;
revoke all on function public.dicey_commit_move(uuid,uuid,uuid,integer,jsonb,uuid,text,smallint) from public, anon, authenticated;
grant execute on function public.dicey_commit_move(uuid,uuid,uuid,integer,jsonb,uuid,text,smallint) to service_role;

-- Pass-and-play backups are explicitly unverified local results, never online rankings.
create table public.dicey_local_history (
  owner_id uuid not null default auth.uid() references auth.users(id),
  game_id uuid not null,
  finished_at timestamptz not null,
  snapshot jsonb not null check (snapshot->'game'->>'status' = 'complete'),
  primary key (owner_id, game_id)
);
alter table public.dicey_local_history enable row level security;
create policy "Owners read history" on public.dicey_local_history for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners back up history" on public.dicey_local_history for insert to authenticated with check ((select auth.uid()) = owner_id);
revoke all on public.dicey_local_history from anon, authenticated;
grant select, insert on public.dicey_local_history to authenticated;
grant all on public.dicey_local_history to service_role;
