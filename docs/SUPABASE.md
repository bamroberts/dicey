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

This is a first online slice, not a public-launch service. Match cancellation,
push notifications, realtime subscriptions, profiles/friends, public rankings,
account deletion flows, abuse quotas, and large-history pagination remain future
work. Online moves require connectivity; they are not queued for offline play.

## Hosted setup (not yet deployed)

Use a dedicated Dicey Supabase project, or explicitly choose an existing project.
Tables and RPCs use the `dicey_` prefix. No hosted project has been modified.

1. Put the project URL and **publishable** key into `mobile/.env.local` using
   `mobile/.env.example`. These are client configuration, not service-role keys.
2. From the repository root, link the selected project and review/apply the
   migration, then deploy the Edge Function:

   ```sh
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push --dry-run
   npx supabase db push
   npx supabase functions deploy dicey
   ```

   The function imports `src/game/engine.ts` directly; deploy from this repo.
   Keep JWT verification enabled. Service-role credentials exist only in the
   Supabase function environment and must never go in Expo variables.
3. Enable email authentication and configure both **Magic Link** and **Confirm
   signup** email templates to include `{{ .Token }}`. The supplied
   `supabase/templates/sign-in.html` is the template. Hosted email configuration
   and SMTP must be configured in the Supabase dashboard; deploying a function
   does not apply the local email-template configuration. The default email
   service may restrict recipients; use a suitable SMTP provider for real testing.
4. Restart Expo after changing `.env.local`. Sign in with two separate email
   accounts/devices, create/join a challenge, score a turn, close/reopen, and test
   retry/reconnect on real phones. Browser local history and phone history are
   separate until explicitly backed up to an account.

Configuration references:
[React Native authentication](https://supabase.com/docs/guides/auth/quickstarts/react-native),
[email OTP templates](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[Edge Function authentication](https://supabase.com/docs/guides/functions/auth).

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

Database behavior has been exercised locally; hosted configuration, email
provider delivery, and two physical devices still need validation after linking.

## Verified in this implementation

41 unit tests pass. Expo typecheck/lint and web/iOS bundle exports pass. The
local integration scenario passes, including competing requests and privileged
RPC denial. Two browser sessions completed email-code sign-in, create/join,
roll/score and turn transfer. A full local game was archived through the UI;
its cloud backup persisted after reload. No hosted deployment has been applied.
