"use client";

import { useRef } from "react";

export default function CaptureButton({
  onCapture,
}: {
  onCapture: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
          // reset so same photo can be retaken
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-5 rounded-2xl text-xl tracking-wide transition select-none"
      >
        Take Photo
      </button>
    </>
  );
}
