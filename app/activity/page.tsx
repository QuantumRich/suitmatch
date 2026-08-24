"use client";

import { useEffect, useState } from "react";
import { getDiscordContext, type DiscordContext } from "@/lib/discord/client";
import { instanceIdToRoomCode } from "@/lib/discord/session";
import RoomBody from "@/components/RoomBody";

type State =
  | { status: "loading"; stage: string }
  | { status: "ready"; ctx: DiscordContext; roomCode: string }
  | { status: "error"; message: string };

export default function ActivityPage() {
  const [state, setState] = useState<State>({ status: "loading", stage: "mounting" });

  useEffect(() => {
    setState({ status: "loading", stage: "calling getDiscordContext" });
    getDiscordContext()
      .then(async (ctx) => {
        setState({ status: "loading", stage: "got context, hashing instanceId" });
        const roomCode = await instanceIdToRoomCode(ctx.instanceId);
        setState({ status: "ready", ctx, roomCode });
      })
      .catch((err) => {
        setState({ status: "error", message: String(err) });
      });
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Connecting to Discord…</p>
          <p className="text-slate-600 text-xs font-mono">{state.stage}</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="bg-rose-900/30 border border-rose-700 rounded-2xl p-6 max-w-sm text-center">
          <p className="text-rose-300 font-semibold mb-2">Couldn't connect to Discord</p>
          <p className="text-rose-400 text-sm font-mono">{state.message}</p>
          <p className="text-slate-500 text-xs mt-4">Make sure you're opening this from inside a Discord voice call.</p>
        </div>
      </div>
    );
  }

  const { ctx, roomCode } = state;
  const displayName = ctx.user.global_name ?? ctx.user.username;

  return (
    <RoomBody
      code={roomCode}
      myUid={ctx.user.id}
      initialName={displayName}
      discordMode
    />
  );
}
