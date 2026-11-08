# Dicey! history and asynchronous challenges

## Implemented slice

- Completed pass-and-play games are automatically archived with a stable game
  ID, finish time, scores, and avatar/name snapshots. Recent 100 local games
  survive rematches and restarts. Existing v1 saves remain compatible; the
  currently saved completed game is archived on the next load. Previously
  replaced games cannot be recovered.
- History lists winners and section totals. Signed-in players can explicitly
  back up individual results to their private Supabase account and read those
  backups from another signed-in device. These are unverified personal records,
  not competitive online scores.
- Email-code sign-in persists across restarts. No account is needed for local play.
- Online: two players alternate full turns. Create a challenge, share its
  16-character code, and have a friend join. Unused invitations expire after
  seven days. Active matches remain available until complete. Games refresh
  every 10 seconds (inbox every 15 seconds) and offer manual refresh.
- The server generates dice and calculates scores using the same TypeScript
  engine as offline play. Clients send only moves, never scores or dice values.
- Database RLS limits reads to participants / backup owners. Clients have no
  direct match-write access. The Edge Function verifies the Supabase user before
  using its service-role client. The privileged commit RPC is service-role only.
- Commit uses a row lock, revision comparison, and an atomic request receipt.
  Duplicate retries return the original response. Competing moves at one revision
  cannot both commit. Pending moves persist on the client before transmission;
  uncertain responses can be retried safely or reconciled with server state.

This is a first online slice, not a public-launch service. Active-game cancellation,
push notifications, realtime subscriptions, profiles/friends, public rankings,
account deletion flows, abuse quotas, and large-history pagination remain future
work. Online moves require connectivity; they are not queued for offline play.

## Shared hosted beta: q-me

The owner selected q-me (`ldokicqlaienedeetjyj`) for the beta. Dicey’s tables,
privileged RPCs, policies, and `dicey` Edge Function are deployed there. The
client's ignored `mobile/.env.local` holds only the project URL/publishable key.
The existing q-me tables, Supabase migration ledger, and auth/email settings
were left unchanged. Dicey uses its own `dicey_schema_migrations` ledger so
q-me's future CLI migrations do not see unexplained remote versions.

**Do not run `supabase db push`, `config push`, or resets against this shared
project from the Dicey repo.** Use the additive, owner-selected deployment path:

```sh
# Repository root: reads/reviews pending Dicey migrations first
node scripts/deploy-shared-schema.mjs
node scripts/deploy-shared-schema.mjs --apply
npx supabase functions deploy dicey --remote=ldokicqlaienedeetjyj --yes
```

The function imports `src/game/engine.ts` directly. JWT verification remains
on. Service-role credentials exist only in Supabase's server environment; they
are never bundled in the app. The integration harness refuses hosted targets.

Auth users and service quotas are shared with q-me. Dicey accepts numeric email
codes **or the original Supabase sign-in link copied from the email**. Link
verification extracts only a token from the configured project's verification
URL; it does not follow q-me's redirect. Shared email branding/redirects stay
intact. Default Supabase email-delivery restrictions and rate limits may limit
new testers; SMTP/provider changes need a separate review for both apps.

Fresh checkout: copy `mobile/.env.example` to `.env.local` and set the shared
project URL and its publishable key. Restart Expo after configuration changes.
On two accounts/devices, sign in, create/join, score, close/reopen, and test retry.
We did not send hosted test emails or run fixture/reset harnesses there.

Configuration references:
[React Native authentication](https://supabase.com/docs/guides/auth/quickstarts/react-native),
[email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[Edge Function authentication](https://supabase.com/docs/guides/functions/auth).

## Invitations and rematches

Completed online games now appear in Game history and have “Challenge a rematch”.
A new targeted invitation appears in the previous opponent's inbox; only that
opponent can accept its seat. Invitations can be declined by the recipient or
cancelled by the sender before a game starts. A concurrent accept/cancel cannot
both commit. Cancellation is not a way to erase an active game's results.

Local history offers “Play again with this crew”. It prefills names/avatars on
the setup screen; it does not overwrite an existing game until Start is pressed.
Native share opens the platform's share sheet; a separate copy action and web
clipboard fallback work without a public web/deep-link host. Users send the
invitation themselves. Turn/rematch invitations sort ahead of waiting/completed
matches, and expired/cancelled states are labelled.

## Local validation

The CLI and Docker are available here. Dicey has an isolated local Supabase
stack so it does not use the ports of other projects:

- API: `http://127.0.0.1:56321`
- Postgres: `56322`
- Studio: `http://127.0.0.1:56323`
- Test email inbox: `http://127.0.0.1:56324`

```sh
# Repository root; local config tested with Supabase CLI 3.0.0
npx supabase start
npx supabase functions serve dicey
# A second terminal:
node scripts/test-online.mjs
# Optional separate browser preview, reads local credentials without writing env files:
node scripts/start-local-online.mjs
```

The isolated browser preview is at `http://localhost:8091`. Email messages land
in the local test inbox; no real email delivery is needed. This localhost setup
is for development on the Mac. Phones need a reachable hosted project or explicit
LAN configuration; the existing Expo Go server is not reconfigured by this script.

The integration test refuses non-local/non-Dicey URLs, creates disposable test
users, exercises a complete 26-turn game, duplicate and conflicting concurrent
requests, hold/roll limits, stale revisions, turn ownership, participant RLS,
privileged RPC denial, and private backups. It removes its users/matches afterward.

Unit checks:

```sh
CI=true npm test -- --watchAll=false --runInBand src/game
cd mobile
npm run typecheck
npm run lint
npm run build:web
```

Database behavior has been exercised locally. Hosted schema/function and
anonymous-access checks pass; hosted email delivery and two-device end-to-end
play still need the owner’s sign-in/device check.

## Verified in this implementation

47 unit tests pass. Expo typecheck/lint and web/iOS bundle exports pass. The
local integration scenario passes, including competing requests and privileged
RPC denial. Two browser sessions completed email-code sign-in, create/join,
roll/score and turn transfer. A full local game was archived through the UI;
its cloud backup persisted after reload. The shared hosted deployment preserves q-me’s original migration versions.
