"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JacketRegion from "./JacketRegion";
import type { Rect } from "@/lib/color/extract";

type Props = {
  file: File;
  onRetake: () => void;
  onAnalyze: (bitmap: ImageBitmap, region: Rect) => void;
};

const DISPLAY_MAX_H = 520;
const DISPLAY_MAX_W = 512;

export default function PhotoReview({ file, onRetake, onAnalyze }: Props) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [region, setRegion] = useState<Rect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDims(null);

    createImageBitmap(file, { imageOrientation: "from-image" })
      .then((bitmap) => {
        if (cancelled) { bitmap.close(); return; }
        bitmapRef.current = bitmap;

        const availW = Math.min(window.innerWidth - 32, DISPLAY_MAX_W);
        const scale = Math.min(1, availW / bitmap.width, DISPLAY_MAX_H / bitmap.height);
        const w = Math.round(bitmap.width * scale);
        const h = Math.round(bitmap.height * scale);
        setDims({ w, h });
        setRegion({ x: w * 0.15, y: h * 0.15, width: w * 0.7, height: h * 0.6 });
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't read this photo. Try retaking it.");
      });

    return () => { cancelled = true; };
  }, [file]);

  // Draw bitmap to canvas once both refs are ready
  const canvasCallbackRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (!canvas || !bitmapRef.current || !dims) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(bitmapRef.current, 0, 0, dims.w, dims.h);
  }, [dims]);

  const handleAnalyze = useCallback(() => {
    if (!bitmapRef.current || !region || !dims) return;
    const scaleX = bitmapRef.current.width / dims.w;
    const scaleY = bitmapRef.current.height / dims.h;
    onAnalyze(bitmapRef.current, {
      x: region.x * scaleX,
      y: region.y * scaleY,
      width: region.width * scaleX,
      height: region.height * scaleY,
    });
  }, [region, dims, onAnalyze]);

  if (error) {
    return (
      <div className="flex flex-col gap-4 px-4 items-center">
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button
          onClick={onRetake}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-4 px-8 rounded-xl text-base transition"
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      <p className="text-zinc-400 text-sm text-center">
        Drag the box to cover your jacket, then tap Analyze.
      </p>

      <div className="relative mx-auto" style={dims ? { width: dims.w, height: dims.h } : { width: "100%", height: 300 }}>
        {!dims && (
          <div className="w-full h-full rounded-xl bg-zinc-800 animate-pulse" />
        )}
        {dims && (
          <canvas
            ref={canvasCallbackRef}
            width={dims.w}
            height={dims.h}
            className="rounded-xl block"
            style={{ width: dims.w, height: dims.h }}
          />
        )}
        {dims && region && (
          <JacketRegion
            containerWidth={dims.w}
            containerHeight={dims.h}
            initialRect={region}
            onChange={setRegion}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetake}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-4 rounded-xl text-base transition"
        >
          Retake
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!region}
          className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-4 rounded-xl text-base transition"
        >
          Analyze
        </button>
      </div>
    </div>
  );
}
