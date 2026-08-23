"use client";

import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";

export type DiscordContext = {
  instanceId: string;
  user: {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
  };
  accessToken: string;
};

let sdkPromise: Promise<DiscordContext> | null = null;

export function getDiscordContext(): Promise<DiscordContext> {
  if (!sdkPromise) sdkPromise = init();
  return sdkPromise;
}

async function init(): Promise<DiscordContext> {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_DISCORD_CLIENT_ID is not set");

  const sdk = new DiscordSDK(clientId);
  await sdk.ready();

  // Patch URL mappings so WebSocket to Cloudflare Worker goes through Discord proxy
  const workerHost = (process.env.NEXT_PUBLIC_WORKER_URL ?? "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (workerHost) {
    patchUrlMappings([{ prefix: "/worker-proxy", target: workerHost }]);
  }

  const { code } = await sdk.commands.authorize({
    client_id: clientId,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds", "applications.commands"],
  });

  // Exchange code for token via server-side endpoint (keeps client_secret out of browser)
  const tokenRes = await fetch("/api/discord/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!tokenRes.ok) throw new Error("Token exchange failed");
  const { access_token } = await tokenRes.json();

  const auth = await sdk.commands.authenticate({ access_token });

  return {
    instanceId: sdk.instanceId ?? "",
    user: {
      id: auth.user.id,
      username: auth.user.username,
      global_name: (auth.user as { global_name?: string }).global_name ?? null,
      avatar: auth.user.avatar ?? null,
    },
    accessToken: access_token,
  };
}
