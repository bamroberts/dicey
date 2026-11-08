# Dicey! delivery plan

## Direction

Build a phone-friendly Expo game for iOS, Android, and web. Support offline
pass-and-play first, then asynchronous online challenges. Keep rules and game
transitions independent of React, storage, and networking.

Existing work is a prototype, including uncommitted source changes. Preserve it
while building the replacement foundation. No deployment or backend is part of
phase 1.

## Milestones

1. **Game foundation (first phase):** typed, immutable TypeScript engine;
   scoring; guarded rolls and holds; category commitment; player rotation;
   bonuses; completion and tied winners; focused automated tests.
   Done when a complete multiplayer game can run without UI or services.
2. **Expo and interaction design:** scaffold a universal Expo app, choose a
   visual direction, and build setup, dice, score preview/confirmation, handoff,
   and results screens. Reuse the engine. Verify web and a native target.
3. **Offline playable release:** wire the complete pass-and-play flow, local
   versioned saves and resume, restart/new game, accessible controls, small
   screen layouts, and interruption recovery. Test complete games on devices.
4. **Online challenge design and service:** settle alternating turns versus
   independent scorecards, invitations/identity, expiry, and visibility. Build
   authenticated match storage and authoritative roll/move validation, revision
   checks, idempotency, and ruleset versioning. Test two clients and retries.
5. **Online experience and release:** challenge inbox, invitations, turn status,
   reconnect behaviour, optional notifications, device QA, and release packaging.

Each milestone should leave a playable or independently verifiable result.

## Phase 1 rules baseline

Preserve the prototype's 13 categories: Ones through Sixes, Three/Four of a
Kind (sum all dice), Full House (exactly 3+2, 25), Small/Large Straight (30/40),
Yahtzee (50), and Chance (sum). Up to three rolls per turn; score after any roll;
allow deliberate zero scores. Each category is used once per player. Upper
section bonus is 35 at 63 or more, matching the prototype's commented intent.
All players complete 13 turns. Equal totals produce shared winners.

This is a versioned provisional baseline, not a decision to discard custom
rules. Repeat-Yahtzee bonuses and joker rules are not implemented. Before UI
sign-off, review these choices and capture any house rules with the owner.

## Architecture

- `src/game`: pure scoring and immutable match transitions, serializable state,
  stable player/category IDs, injected random source, and ruleset version.
- Future UI: renders state and dispatches moves; cannot bypass engine guards.
- Future persistence: storage adapter, schema validation/migration, save/resume.
- Future online service: owns random outcomes and validates moves using the same
  engine; never accepts client-calculated totals as authoritative.

Randomness injection supports deterministic tests; it does not make client-side
rolls suitable for competitive online play. Durable save validation belongs in
phase 3; online concurrency and access controls belong in phase 4.

## Progress

- Review completed; existing UI/store mismatch and incomplete game flow identified.
- Phase 1 complete: independent engine with 25 passing tests and a strict,
  isolated TypeScript check. Existing UI remains on its prototype store.
- Phase 2 in progress: Dicey! naming and Arcade Night visual direction selected
  by the owner; see `docs/BRAND.md` and `design/dicey-arcade-v1.png`.
- Phase 2 playable slice implemented in `mobile/`: Expo Router, Arcade Night
  theme, avatar sheet, setup, turns, score confirmation, handoff, and results.
- Validation: TypeScript and lint pass; web and iOS bundle exports pass. Web
  preview checked at 390px through setup, roll, hold, score, and handoff.
- Outstanding for phase 2: native runtime/device QA and final wordmark/launcher
  assets. No simulator is installed in the current environment.
- Phase 3 in progress: section/grand totals, pinned score confirmation,
  serialized versioned save/resume with validation and error handling, saved
  handoff, abandon confirmation, roll tap-lock and staggered dice animation,
  reduced-motion support, and visual remaining-roll markers implemented.
- Next: real-device interruption/safe-area QA; broader transitions and final
  artwork follow functional polish. Online work remains phase 4.

## Validation

Run engine tests with:

```sh
CI=true npm test -- --watchAll=false --runInBand src/game/engine.test.ts
```

Check the isolated engine and tests with:

```sh
npx tsc --noEmit --strict --skipLibCheck --target es2017 --moduleResolution node src/game/engine.ts src/game/engine.test.ts
```

These checks cover all categories, straight duplicates, input immutability,
bonus threshold, holds, roll limits, category reuse, player rotation, complete
solo/multiplayer games, and tied winners. They do not certify the old UI:
its store/type inconsistencies and starter test remain pending replacement.
The legacy CRA test runner also emits a Babel dependency warning.
Installing dependencies synchronized the npm lockfile with the already-present
Easy Peasy dependency; no dependency was added to package.json in phase 1.

## Offline polish validation

- 37 engine/save tests pass, including invalid saves, zero scores, held dice,
  handoff, and completed-game restoration.
- Expo typecheck, lint, web export, and iOS bundle export pass.
- Browser checks: immediate duplicate roll consumes one roll; pinned confirmation
  visible at phone width; save/resume retains dice and holds; scored turn resumes
  at handoff after page reload. Real-device termination/safe-area QA is outstanding.
- Roll outcomes save immediately; the short animation is presentation only.
  No extra rolls are generated for animation. Screen transitions remain later polish.

## Supabase and recorded games

Supabase is the chosen online service. The first implementation uses email-code
accounts and invite-code challenges with two players alternating turns. See
`docs/SUPABASE.md` for the API behavior, deployment steps, and current limitations.

- Local history, stable match IDs, result backups, sign-in, challenge inbox,
  create/join, server-authoritative moves, safe retry/reconnect, and results built.
- Supabase schema/RLS and atomic revision/idempotency RPC tested in an isolated
  local stack. A full two-player game and privacy/turn/retry checks pass.
- Browser sign-in using the local mail inbox, invitation creation/join across
  two signed-in browser sessions, roll/score, and turn transfer checked.
- Hosted beta now reuses q-me by owner choice. Only Dicey-prefixed objects and
  the Dicey function were added; q-me migrations/auth configuration are preserved.
- Next after activation: physical-device online testing, then notifications,
  invite sharing polish, match cancellation, and account/profile polish.


## Invitation polish and next device milestone

- Rematches from online history/results target the previous opponent. Local
  history prefills the original crew without overwriting the active game.
- Invitation share/copy, cancellation/decline, expiry labels, and inbox priority
  implemented and tested in the local stack. A Dicey app icon replaces the Expo
  starter icon; final vector wordmark and splash polish remain artwork tasks.
- Development-client package/build profiles are prepared. Expo Go remains the
  default command. No cloud build, signing setup, or paid account was created.
- Next: owner signs into the hosted beta on two devices. Then implement/test
  turn notifications using the path in `docs/DEVICE-TESTING.md`.
- Hosting decision and costs: `docs/HOSTING.md`; no Pro upgrade is needed now.
