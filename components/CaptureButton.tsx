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
          className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-5 rounded-2xl text-lg tracking-wide transition select-none"
        >
          Take Photo
        </button>
        <button
          onClick={() => libraryRef.current?.click()}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white font-semibold py-5 rounded-2xl text-lg transition select-none"
        >
          Choose
        </button>
      </div>
    </>
  );
}
