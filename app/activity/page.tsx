"use client";

import { useEffect, useState } from "react";
import { getDiscordContext, type DiscordContext } from "@/lib/discord/client";
import { instanceIdToRoomCode } from "@/lib/discord/session";

type State =
  | { status: "loading" }
  | { status: "ready"; ctx: DiscordContext; roomCode: string }
  | { status: "error"; message: string };

export default function ActivityPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    getDiscordContext()
      .then(async (ctx) => {
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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40 mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="11" cy="16" r="6" fill="white" fillOpacity="0.9"/>
            <circle cx="21" cy="16" r="6" fill="white" fillOpacity="0.5"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">SuitMatch</h1>
        <p className="text-slate-400 text-sm mt-1">Activity loaded</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-xs flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Logged in as</span>
          <span className="font-semibold text-slate-100">{displayName}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Room code</span>
          <span className="font-mono font-bold text-violet-300 tracking-widest">{roomCode}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Instance ID</span>
          <span className="font-mono text-xs text-slate-500 truncate max-w-[140px]">{ctx.instanceId}</span>
        </div>
      </div>

      <p className="text-slate-600 text-xs text-center max-w-xs">
        Phase 1 — identity confirmed. Room routing and full UI coming next.
      </p>
    </div>
  );
}
