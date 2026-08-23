"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import NameGate from "@/components/NameGate";
import CaptureButton from "@/components/CaptureButton";
import PhotoReview from "@/components/PhotoReview";
import ResultCard from "@/components/ResultCard";
import GroupResults from "@/components/GroupResults";
import LightingBadge from "@/components/LightingBadge";
import { analyze } from "@/lib/color/pipeline";
import { openRoom, type RoomHandle } from "@/lib/realtime/client";
import type { Measurement, RoomState } from "@/lib/realtime/types";
import { getUserId, getDisplayName } from "@/lib/util/storage";
import { normalizeCode } from "@/lib/util/roomCode";
import type { Rect } from "@/lib/color/extract";

type Stage =
  | "name-gate"
  | "instructions"
  | "review"
  | "analyzing"
  | "result";

export default function RoomPage() {
  const params = useParams();
  const code = normalizeCode(String(params.room));

  const [stage, setStage] = useState<Stage>("name-gate");
  const [myName, setMyName] = useState<string | null>(null);
  const [myUid] = useState(() => getUserId());

  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const roomRef = useRef<RoomHandle | null>(null);

  // Initialize name from storage
  useEffect(() => {
    const name = getDisplayName();
    if (name) {
      setMyName(name);
      setStage("instructions");
    } else {
      setStage("name-gate");
    }
  }, []);

  // Connect to realtime room once we have a name
  useEffect(() => {
    if (!myName) return;

    setWsStatus("connecting");
    const handle = openRoom(code, myUid, myName, {
      onState: (state) => {
        setRoomState(state);
        setWsStatus("connected");
      },
      onError: () => setWsStatus("disconnected"),
      onClose: () => setWsStatus("disconnected"),
    });
    roomRef.current = handle;

    return () => {
      handle.close();
      roomRef.current = null;
    };
  }, [code, myUid, myName]);

  function handleName(name: string) {
    setMyName(name);
    setStage("instructions");
  }

  function handleCapture(file: File) {
    setCapturedFile(file);
    setAnalyzeError(null);
    setStage("review");
  }

  function handleRetake() {
    setCapturedFile(null);
    setStage("instructions");
  }

  const handleAnalyze = useCallback(
    async (bitmap: ImageBitmap, region: Rect) => {
      setStage("analyzing");
      setAnalyzeError(null);
      try {
        const m = analyze(bitmap, region);

        if (m.lightingQuality < 0.3) {
          setAnalyzeError(
            "This photo is too dark or poorly lit to compare reliably. Try taking another photo in brighter, neutral lighting."
          );
          setStage("review");
          return;
        }
        if (m.jacketVisibility < 0.2) {
          setAnalyzeError(
            "We can't see enough of the jacket. Step back and show more of your torso."
          );
          setStage("review");
          return;
        }

        setMeasurement(m);
        setStage("result");
        roomRef.current?.sendMeasurement(m);

        // Auto-set reference if none
        if (roomState && !roomState.referenceUid) {
          roomRef.current?.setReference(myUid);
        }
      } catch (err) {
        setAnalyzeError("Analysis failed. Please retake the photo.");
        setStage("review");
      }
    },
    [myUid, roomState]
  );

  function handleSetReference(uid: string) {
    roomRef.current?.setReference(uid);
  }

  const referenceParticipant = roomState?.participants.find(
    (p) => p.uid === roomState.referenceUid
  );

  const myParticipant = roomState?.participants.find((p) => p.uid === myUid);
  const effectiveMeasurement = myParticipant?.measurement ?? measurement;

  const soloInRoom = roomState && roomState.participants.length === 1 && roomState.participants[0].uid === myUid;

  const groupPanel = myName && roomState ? (
    <div className="px-4 pb-2 max-w-sm mx-auto w-full">
      {soloInRoom && (
        <div className="mb-3 bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-zinc-300 text-sm">
            Share <span className="font-mono font-bold text-white">{code}</span> to invite others
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="text-xs text-blue-400 hover:text-blue-300 underline shrink-0"
          >
            Copy link
          </button>
        </div>
      )}
      <GroupResults
        room={roomState}
        myUid={myUid}
        onSetReference={handleSetReference}
      />
    </div>
  ) : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <span className="font-bold text-lg">SuitMatch</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm bg-zinc-800 px-2 py-1 rounded tracking-widest">{code}</span>
          <div
            className={`w-2 h-2 rounded-full ${
              wsStatus === "connected" ? "bg-emerald-500" : wsStatus === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            }`}
            title={wsStatus}
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-6">
        {stage === "name-gate" && <NameGate onDone={handleName} />}

        {stage === "instructions" && (
          <div className="flex flex-col gap-4 py-4 max-w-sm mx-auto">
            {groupPanel}
            <div className="px-4 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold mb-3">Get a good reading</h2>
                <ul className="text-zinc-300 space-y-2 text-base">
                  <li>• Show your full jacket</li>
                  <li>• Use normal or neutral lighting</li>
                  <li>• Avoid colored LED lights</li>
                  <li>• Don't use photo filters</li>
                  <li>• Keep the jacket reasonably flat</li>
                  <li>• Avoid strong shadows</li>
                </ul>
              </div>
              <CaptureButton onCapture={handleCapture} />
            </div>
          </div>
        )}

        {stage === "review" && capturedFile && (
          <div className="py-4">
            {analyzeError && (
              <div className="mx-4 mb-4 bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
                {analyzeError}
              </div>
            )}
            <PhotoReview
              file={capturedFile}
              onRetake={handleRetake}
              onAnalyze={handleAnalyze}
            />
          </div>
        )}

        {stage === "analyzing" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-400">Analyzing suit color…</p>
            </div>
            {groupPanel}
          </div>
        )}

        {stage === "result" && effectiveMeasurement && (
          <div className="flex flex-col gap-4 py-4 max-w-sm mx-auto">
            <div className="px-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Your Suit</h2>
                <LightingBadge quality={effectiveMeasurement.lightingQuality} />
              </div>
              <ResultCard
                measurement={effectiveMeasurement}
                reference={referenceParticipant?.measurement ?? null}
                referenceName={referenceParticipant?.name ?? null}
              />
              <button
                onClick={handleRetake}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 rounded-xl text-sm transition"
              >
                Retake Photo
              </button>
            </div>
            {groupPanel}
          </div>
        )}
      </main>
    </div>
  );
}
