"use client";

import { useState } from "react";
import { setDisplayName } from "@/lib/util/storage";

export default function NameGate({ onDone }: { onDone: (name: string) => void }) {
  const [value, setValue] = useState("");

  function submit() {
    const name = value.trim();
    if (!name) return;
    setDisplayName(name);
    onDone(name);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6">
      <h1 className="text-2xl font-bold mb-2 tracking-wide">SuitMatch</h1>
      <p className="text-zinc-400 mb-8 text-center">Enter your name so the group can see your result.</p>
      <input
        autoFocus
        type="text"
        className="w-full max-w-xs bg-zinc-800 border border-zinc-600 rounded-xl px-4 py-3 text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        placeholder="Your name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        maxLength={30}
      />
      <button
        onClick={submit}
        disabled={!value.trim()}
        className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-lg transition"
      >
        Continue
      </button>
    </div>
  );
}
