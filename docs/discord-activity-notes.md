# Discord Activity — SDK & API Notes

Researched 2026-08-23. Re-verify before any SDK upgrade.

## Package

```
npm install @discord/embedded-app-sdk
```

No pinned version in docs — check npm for latest before installing.

## SDK init sequence

```ts
import { DiscordSDK } from "@discord/embedded-app-sdk";

const sdk = new DiscordSDK(DISCORD_CLIENT_ID);
await sdk.ready(); // resolves when iframe is connected to Discord client

// 1. Authorize (client-side) — gets a one-time code
const { code } = await sdk.commands.authorize({
  client_id: DISCORD_CLIENT_ID,
  response_type: "code",
  state: "",
  prompt: "none",
  scope: ["identify", "guilds", "applications.commands"],
});

// 2. Exchange code for token (server-side — POST /api/discord/token)
//    Sends: { code }
//    Returns: { access_token }

// 3. Authenticate SDK with token
const auth = await sdk.commands.authenticate({ access_token });
// auth.user = { id, username, global_name, avatar, ... }
```

## instanceId

- `sdk.instanceId` — available after `ready()`. Stable for the lifetime of one Activity launch in a voice channel.
- All users who join the same Activity launch share the same `instanceId`.
- Use it as the room key: `instanceId → SuitMatch room code`.
- Validate legitimacy server-side via Discord's Activity Instance API if needed:
  `GET /api/applications/{application_id}/activity-instances/{instance_id}`

## Connected participants

```ts
const { participants } = await sdk.commands.getInstanceConnectedParticipants();
sdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handler);
```

Returns Discord User objects with `id`, `username`, `global_name`.

## URL Mapping (proxy)

Discord sandboxes Activities through `{clientId}.discordsays.com`. All external fetch/WebSocket calls must be routed via the proxy using URL mappings.

Developer Portal → Applications → [app] → Activities → URL Mappings:

| Prefix | Target |
|--------|--------|
| `/` | `{vercel-domain}` (root — your Next.js app) |
| `/ws` | `suitmatch-worker.suitmatch.workers.dev` (Cloudflare Worker WS) |

In code, use `patchUrlMappings()` at startup:

```ts
sdk.patchUrlMappings([
  { prefix: "/ws", target: "suitmatch-worker.suitmatch.workers.dev" }
]);
```

After patching, WebSocket connections to `suitmatch-worker.suitmatch.workers.dev` are automatically rewritten to go through the proxy.

## OAuth token exchange endpoint

Must be server-side (keeps `DISCORD_CLIENT_SECRET` out of browser). Adding to the Cloudflare Worker as `POST /api/discord/token`.

Request body: `{ code: string }`
Response: `{ access_token: string }`

Calls `https://discord.com/api/oauth2/token` with `client_id`, `client_secret`, `grant_type: "authorization_code"`, `code`.

## Local development

- Requires a public HTTPS tunnel. Recommended: `cloudflared tunnel --url http://localhost:3000`
- Set the Activity's root URL mapping in the Developer Portal to the cloudflared URL.
- The tunnel URL changes each run — update the portal mapping each local dev session (or use a paid fixed URL).

## Mobile platform support

- iOS and Android supported. Enable per-platform in Developer Portal → Activities → Settings.
- Camera / `<input type="file">` restrictions inside the Discord mobile iframe are **not documented** — must be empirically tested (Phase 5).

## Platform-specific SDK limitations

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| `encourageHardwareAcceleration()` | ✓ | ✗ | ✗ |
| `openShareMomentDialog()` | ✓ | ✗ | ✗ |
| `setOrientationLockState()` | ✗ | ✓ | ✓ |

## Environment variables needed

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | Vercel (all envs) | SDK init, authorize() |
| `DISCORD_CLIENT_SECRET` | Cloudflare Worker secret | Token exchange (never in browser) |
| `NEXT_PUBLIC_WORKER_URL` | Vercel (existing) | Cloudflare WS base URL |
