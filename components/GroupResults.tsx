"use client";

import { deltaEToScore, scoreToCategory } from "@/lib/color/score";
import { deltaE } from "@/lib/color/distance";
import { tupleToLab } from "@/lib/color/space";
import type { RoomState } from "@/lib/realtime/types";

type Props = {
  room: RoomState;
  myUid: string;
  onSetReference: (uid: string) => void;
};

const emoji = { excellent: "🟢", good: "🟢", borderline: "🟡", poor: "🔴" } as const;

export default function GroupResults({ room, myUid, onSetReference }: Props) {
  const ref = room.participants.find((p) => p.uid === room.referenceUid);

  const sorted = [...room.participants].sort((a, b) => {
    if (a.uid === room.referenceUid) return -1;
    if (b.uid === room.referenceUid) return 1;
    return 0;
  });

  return (
    <div className="bg-zinc-900 rounded-2xl p-5">
      <div className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Group</div>

      {room.participants.length === 0 && (
        <div className="text-zinc-500 text-sm">No participants yet.</div>
      )}

      <div className="flex flex-col gap-2">
        {sorted.map((p) => {
          const isRef = p.uid === room.referenceUid;
          const isMe = p.uid === myUid;

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
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                isRef ? "bg-blue-900/40 border border-blue-700" : "bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-zinc-100 truncate">
                  {p.name}{isMe ? " (you)" : ""}
                </span>
                {isRef && (
                  <span className="text-xs bg-blue-700 text-blue-100 rounded px-1.5 py-0.5 shrink-0">
                    REF
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!p.measurement && (
                  <span className="text-zinc-500 text-xs">…</span>
                )}
                {score !== null && (
                  <span className="font-bold text-zinc-100">{score}%</span>
                )}
                {em && <span>{em}</span>}
                {isMe && !isRef && (
                  <button
                    onClick={() => onSetReference(p.uid)}
                    className="ml-1 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Set as ref
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!ref && (
        <p className="text-zinc-500 text-xs mt-3">
          The first person to submit becomes the reference, or tap "Set as ref".
        </p>
      )}
    </div>
  );
}
