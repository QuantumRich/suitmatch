"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateRoomCode, isValidRoomCode, normalizeCode } from "@/lib/util/roomCode";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">SuitMatch</h1>
          <p className="text-zinc-400 text-base">Are your suits actually the same color?</p>
        </div>

        <button
          onClick={createRoom}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-5 rounded-2xl text-xl transition"
        >
          Create Room
        </button>

        <div className="flex flex-col gap-3">
          <div className="text-zinc-400 text-sm text-center">or join an existing room</div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-lg text-white placeholder-zinc-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-5 rounded-xl transition"
            >
              Join
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
