"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateRoomCode, isValidRoomCode, normalizeCode } from "@/lib/util/roomCode";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  // Detect Discord iframe and redirect to Activity entry point
  if (typeof window !== "undefined" && window.self !== window.top) {
    router.replace("/activity");
    return null;
  }

  function createRoom() {
    const code = generateRoomCode();
    router.push(`/${code}`);
  }

  function joinRoom() {
    const code = normalizeCode(joinCode);
    if (!isValidRoomCode(code)) {
      setError("Enter a valid 4-letter room code.");
      return;
    }
    router.push(`/${code}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-10">

        <div className="text-center flex flex-col gap-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="11" cy="16" r="6" fill="white" fillOpacity="0.9"/>
              <circle cx="21" cy="16" r="6" fill="white" fillOpacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">SuitMatch</h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Match your look with the group.<br/>Snap a photo — we'll handle the color science.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={createRoom}
            className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 active:from-violet-600 active:to-indigo-600 text-white font-bold py-5 rounded-2xl text-lg transition shadow-lg shadow-violet-900/30"
          >
            Create Room
          </button>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-500 text-sm">or join</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-lg text-slate-100 placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="CODE"
                value={joinCode}
                onChange={(e) => {
                  setError("");
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6));
                }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                maxLength={6}
              />
              <button
                onClick={joinRoom}
                className="bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 font-bold px-5 rounded-xl transition"
              >
                Join
              </button>
            </div>
            {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center">
          Photos never leave your device.
        </p>
      </div>
    </div>
  );
}
