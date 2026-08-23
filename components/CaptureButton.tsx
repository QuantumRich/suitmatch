"use client";

import { useRef } from "react";

export default function CaptureButton({
  onCapture,
}: {
  onCapture: (file: File) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = "";
  }

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
      <input ref={libraryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <div className="flex gap-3">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex-1 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 active:from-violet-600 active:to-indigo-600 text-white font-bold py-5 rounded-2xl text-lg transition shadow-lg shadow-violet-900/30 select-none"
        >
          Take Photo
        </button>
        <button
          onClick={() => libraryRef.current?.click()}
          className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-200 font-semibold py-5 rounded-2xl text-lg transition select-none"
        >
          Choose
        </button>
      </div>
    </>
  );
}
