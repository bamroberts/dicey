# Device preview and notifications

`cd mobile && npm start` explicitly uses Expo Go. Installing the development
client package does not switch this command away from Expo Go. Existing previews
continue to use the shared rules and session data.

## Development builds (prepared, not built)

`mobile/eas.json` has development, iOS simulator, and internal-preview profiles.
`expo-dev-client` is installed. No Expo cloud build, signing credential creation,
store enrollment, or paid purchase has been run.

When ready, choose the app's permanent iOS bundle identifier and Android package
name, register/link the Expo project, and check the account's build allowance.
Then run from `mobile`:

```sh
npx eas-cli@latest build --profile development --platform ios
# or --platform android; use --profile simulator for an iOS simulator artifact
npm run start:dev
```

The development build is your own native shell, including the new Dicey icon.
Expo Go will not change its own launcher icon. The icon source and imagegen
prompt are `mobile/assets/dicey-icon-v1.png` and `design/APP-ICON-PROMPT.txt`.
Platform icon masks still need installed-device visual QA.

## Push notifications: next implementation

Remote notifications need an installed development build for complete testing;
Expo Go on Android does not support them. See
[Expo notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/).

Planned implementation after two-device hosted turn testing:

1. Add the notifications module/config and obtain the Expo project ID plus
   platform push credentials. Request permissions only from an explicit
   “Notify me when it’s my turn” control.
2. Register each signed-in device token with owner-only policies. Remove tokens
   on opt-out/sign-out; never expose tokens in match responses.
3. Add a transactional outbox keyed by match/revision/recipient on **score commit**
   and rematch creation. Rolls and hold changes do not notify opponents.
4. A server worker sends and retries outbox events, checks provider receipts,
   and removes expired tokens. The game commit must not depend on push delivery.
5. Opening a notification routes to the challenge, verifies the current account,
   and refreshes server state. Test denial, cold launch, sign-out, duplicate
   events, and failed deliveries on both platforms.

No notification permission prompt or “enabled” claim is shipped before this
path exists. Challenge ordering and manual/periodic refresh already work.
