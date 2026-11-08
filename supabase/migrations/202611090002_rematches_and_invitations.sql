alter table public.dicey_matches
  add column invited_id uuid references auth.users(id),
  add column invited_name text,
  add column invited_avatar smallint check (invited_avatar between 0 and 5),
  add column rematch_of uuid references public.dicey_matches(id) on delete set null;
-- Name these checks explicitly so future changes do not depend on generated names.
alter table public.dicey_matches drop constraint dicey_matches_status_check;
alter table public.dicey_matches add constraint dicey_matches_status_check
  check (status in ('waiting','playing','complete','cancelled'));
alter table public.dicey_matches drop constraint dicey_matches_check1;
alter table public.dicey_matches add constraint dicey_match_state_consistent check (
  (status in ('waiting','cancelled') and state is null and guest_id is null) or
  (status in ('playing','complete') and state is not null and guest_id is not null)
);
alter table public.dicey_matches add constraint dicey_invited_not_host check (host_id is distinct from invited_id);
create index dicey_matches_invited on public.dicey_matches(invited_id, updated_at desc);
drop policy "Participants read matches" on public.dicey_matches;
create policy "Participants read matches" on public.dicey_matches for select to authenticated
  using ((select auth.uid()) = host_id or (select auth.uid()) = guest_id or (select auth.uid()) = invited_id);

create or replace function public.dicey_commit_move(p_match uuid, p_request uuid,
  p_actor uuid, p_revision integer, p_state jsonb,
  p_guest uuid default null, p_name text default null, p_avatar smallint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.dicey_matches; receipt public.dicey_move_receipts; result jsonb;
begin
  select * into m from public.dicey_matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  select * into receipt from public.dicey_move_receipts where match_id = p_match and request_id = p_request;
  if found then
    if receipt.actor_id <> p_actor then raise exception 'Request belongs to another player'; end if;
    return receipt.result;
  end if;
  if m.revision <> p_revision then raise exception 'STALE_REVISION'; end if;
  if p_guest is not null then
    if m.status <> 'waiting' or m.host_id = p_actor or p_guest <> p_actor or m.expires_at < now()
      or (m.invited_id is not null and m.invited_id <> p_actor)
      then raise exception 'Invitation unavailable'; end if;
  elsif m.status <> 'playing' or (p_actor is distinct from m.host_id and p_actor is distinct from m.guest_id) then
    raise exception 'Not a participant in an active game';
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

create function public.dicey_cancel_invitation(p_match uuid, p_request uuid, p_actor uuid, p_revision integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.dicey_matches; receipt public.dicey_move_receipts; result jsonb;
begin
  select * into m from public.dicey_matches where id = p_match for update;
  if not found then raise exception 'Match not found'; end if;
  select * into receipt from public.dicey_move_receipts where match_id = p_match and request_id = p_request;
  if found then
    if receipt.actor_id <> p_actor then raise exception 'Request belongs to another player'; end if;
    return receipt.result;
  end if;
  if m.revision <> p_revision then raise exception 'STALE_REVISION'; end if;
  if m.status <> 'waiting' or (p_actor <> m.host_id and p_actor is distinct from m.invited_id)
    then raise exception 'Only unused invitations can be cancelled'; end if;
  update public.dicey_matches set status = 'cancelled', revision = revision + 1,
    updated_at = now() where id = p_match returning to_jsonb(dicey_matches.*) into result;
  insert into public.dicey_move_receipts values (p_match, p_request, p_actor, result);
  return result;
end;
$$;
revoke all on function public.dicey_cancel_invitation(uuid,uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.dicey_cancel_invitation(uuid,uuid,uuid,integer) to service_role;
