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

const categoryDot = {
  excellent: "text-emerald-400",
  good: "text-teal-400",
  borderline: "text-amber-400",
  poor: "text-rose-400",
} as const;

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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="flex items-baseline justify-between px-4 py-3 border-b border-slate-800">
        <div className="text-sm font-semibold text-slate-100">{total} in room</div>
        <div className="text-xs text-slate-500">{scanned} of {total} scanned</div>
      </div>

      {total === 0 && (
        <div className="text-slate-500 text-sm px-4 py-4">No one here yet.</div>
      )}

      <div className="flex flex-col divide-y divide-slate-800">
        {sorted.map((p) => {
          const isRef = p.uid === room.referenceUid;
          const isMe = p.uid === myUid;
          const isRecent = now - p.updatedAt < RECENT_MS && p.measurement != null;

          let score: number | null = null;
          let dotClass = "";
          if (ref?.measurement && p.measurement && !isRef) {
            const de = deltaE(tupleToLab(p.measurement.lab), tupleToLab(ref.measurement.lab));
            score = deltaEToScore(de);
            dotClass = categoryDot[scoreToCategory(score)];
          }

          return (
            <div
              key={p.uid}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isRecent ? "bg-violet-900/20" : isRef ? "bg-slate-800/50" : ""
              }`}
            >
              {/* Swatch circle */}
              <div
                className="w-9 h-9 rounded-full shrink-0 border-2 transition-all"
                style={
                  p.measurement?.swatchHex
                    ? { backgroundColor: p.measurement.swatchHex, borderColor: "transparent" }
                    : { backgroundColor: "transparent", borderColor: "#334155" }
                }
              >
                {!p.measurement && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-100 truncate">
                    {p.name}{isMe ? " (you)" : ""}
                  </span>
                  {isRef && (
                    <span className="text-xs bg-violet-800/60 text-violet-200 border border-violet-700 rounded-full px-2 py-0.5 shrink-0">
                      ref
                    </span>
                  )}
                </div>
              </div>

              {/* Score + actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!p.measurement && <span className="text-slate-600 text-xs">waiting…</span>}
                {score !== null && (
                  <span className={`font-bold text-sm ${dotClass}`}>{score}%</span>
                )}
                {isMe && !isRef && (
                  <button
                    onClick={() => onSetReference(p.uid)}
                    className="text-xs text-violet-400 hover:text-violet-300 underline ml-1"
                  >
                    Set ref
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!ref && total > 0 && (
        <p className="text-slate-500 text-xs px-4 py-3 border-t border-slate-800">
          First to submit becomes the reference, or tap "Set ref".
        </p>
      )}
    </div>
  );
}
