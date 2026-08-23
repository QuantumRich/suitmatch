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
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-xs flex flex-col gap-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">What should we call you?</h1>
          <p className="text-slate-400 text-sm">Your name shows up in the group panel so everyone can see who's who.</p>
        </div>
        <input
          autoFocus
          type="text"
          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition text-center"
          placeholder="Your name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={30}
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 disabled:opacity-40 disabled:pointer-events-none text-white font-bold py-4 rounded-xl text-lg transition shadow-lg shadow-violet-900/30"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
