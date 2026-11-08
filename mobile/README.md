# Dicey! Expo app

From this directory:

```sh
npm ci
npm start          # Expo dev server / physical-device QR
npm run web        # Browser development
npm run ios        # Requires an installed iOS simulator
npm run android    # Requires Android device/emulator
npm run typecheck
npm run lint
npm run build:web
```

This is the active app. The original CRA prototype remains at the repository
root for reference. The app imports the single engine in `../src/game/engine.ts`;
Metro watches that directory. Use the mobile lockfile for the Expo dependencies.
Expo Router owns navigation; a session context holds the current match.

## Current slice

Arcade Night theme, bundled Lilita One/Nunito Sans fonts, six generated avatar
portraits displayed from `assets/avatars.png`, 2–4 player setup, dice holds,
three-roll limit, full score previews and confirmation, player handoff, final
scorecards with section totals, shared winners, rematch, and automatic local
save/resume. Score confirmation stays pinned beneath the scrolling scorecard.
A 950ms roll lock prevents double taps; unheld dice animate in a stagger, with
reduced-motion support. Three dice markers show remaining rolls. Completed
games are archived automatically in Game history.

Supabase sign-in, optional private result backups, and two-player asynchronous
invite challenges are implemented. See [Supabase setup](../docs/SUPABASE.md)
for the required project configuration and local test preview. Without project
environment variables, local play and history work and the online screen explains
that the service is not connected.

The wordmark currently uses real styled text; custom vector lettering and final
launcher/splash icons remain artwork tasks. Template launcher assets remain.
The generated avatar sheet is clipped in the UI and kept unmodified; its prompt
is in `../design/AVATAR-PROMPT.txt`. Fonts include their upstream license files
in the installed font packages (SIL Open Font License).

## Limits

Sessions are versioned, validated on load, and saved after moves via AsyncStorage
(local browser storage on web). Dice, holds, scores, player identity, results,
and handoff survive reloads. Writes are serialized; storage failures are shown
in the UI. Malformed/incompatible saves require an explicit start-fresh action.
A hard process kill before an asynchronous write finishes can still lose the
last move. Native interruption recovery needs device testing. Hosted online
activation, push notifications, sound, haptics, broader screen transitions, and
release packaging remain later work. Native runtime/device testing is still
required; bundle export is not a substitute for running on a device.
