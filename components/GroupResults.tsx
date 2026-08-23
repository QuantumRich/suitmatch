"use client";

import { deltaEToScore, scoreToCategory } from "@/lib/color/score";
import { deltaE } from "@/lib/color/distance";
import { tupleToLab } from "@/lib/color/space";
import type { RoomState, Participant } from "@/lib/realtime/types";

type Props = {
  room: RoomState;
  myUid: string;
  onSetReference: (uid: string) => void;
};

const emoji = { excellent: "🟢", good: "🟢", borderline: "🟡", poor: "🔴" } as const;

const RECENT_MS = 3000;

function sortParticipants(participants: Participant[], referenceUid: string | null): Participant[] {
  return [...participants].sort((a, b) => {
    if (a.uid === referenceUid) return -1;
    if (b.uid === referenceUid) return 1;
    const aHas = a.measurement != null ? 1 : 0;
    const bHas = b.measurement != null ? 1 : 0;
    if (aHas !== bHas) return bHas - aHas;
    return b.updatedAt - a.updatedAt;
  });
}

export default function GroupResults({ room, myUid, onSetReference }: Props) {
  const ref = room.participants.find((p) => p.uid === room.referenceUid);
  const scanned = room.participants.filter((p) => p.measurement != null).length;
  const total = room.participants.length;
  const now = Date.now();

  const sorted = sortParticipants(room.participants, room.referenceUid);

  return (
    <div className="bg-zinc-900 rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-semibold text-zinc-100">{total} in room</div>
        <div className="text-xs text-zinc-400">{scanned} of {total} scanned</div>
      </div>

      {total === 0 && (
        <div className="text-zinc-500 text-sm">No participants yet.</div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((p) => {
          const isRef = p.uid === room.referenceUid;
          const isMe = p.uid === myUid;
          const isRecent = now - p.updatedAt < RECENT_MS && p.measurement != null;

          let score: number | null = null;
          let em = "";
          if (ref?.measurement && p.measurement && !isRef) {
            const de = deltaE(tupleToLab(p.measurement.lab), tupleToLab(ref.measurement.lab));
            score = deltaEToScore(de);
            em = emoji[scoreToCategory(score)];
          }

          return (
            <div
              key={p.uid}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                isRef
                  ? "bg-blue-900/40 border border-blue-700"
                  : isRecent
                  ? "bg-zinc-800 border border-blue-500 animate-pulse"
                  : "bg-zinc-800 border border-transparent"
              }`}
            >
              {/* Swatch circle */}
              <div
                className="w-9 h-9 rounded-full shrink-0 border-2"
                style={
                  p.measurement?.swatchHex
                    ? { backgroundColor: p.measurement.swatchHex, borderColor: p.measurement.swatchHex }
                    : { backgroundColor: "transparent", borderColor: "#52525b" }
                }
              >
                {!p.measurement && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-zinc-100 truncate">
                    {p.name}{isMe ? " (you)" : ""}
                  </span>
                  {isRef && (
                    <span className="text-xs bg-blue-700 text-blue-100 rounded px-1.5 py-0.5 shrink-0">
                      REF
                    </span>
                  )}
                </div>
              </div>

              {/* Score + actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!p.measurement && <span className="text-zinc-500 text-xs">…</span>}
                {score !== null && <span className="font-bold text-zinc-100">{score}%</span>}
                {em && <span>{em}</span>}
                {isMe && !isRef && (
                  <button
                    onClick={() => onSetReference(p.uid)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Set as ref
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!ref && total > 0 && (
        <p className="text-zinc-500 text-xs mt-3">
          First to submit becomes the reference, or tap "Set as ref".
        </p>
      )}
    </div>
  );
}
