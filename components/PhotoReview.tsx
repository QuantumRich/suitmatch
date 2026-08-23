"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JacketRegion from "./JacketRegion";
import type { Rect } from "@/lib/color/extract";

type Props = {
  file: File;
  onRetake: () => void;
  onAnalyze: (bitmap: ImageBitmap, region: Rect) => void;
};

const DISPLAY_MAX = 420; // px — max displayed image height

export default function PhotoReview({ file, onRetake, onAnalyze }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [region, setRegion] = useState<Rect | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    let bm: ImageBitmap;
    createImageBitmap(file).then((bitmap) => {
      bitmapRef.current = bitmap;
    });

    const img = new Image();
    img.onload = () => {
      const containerW = containerRef.current?.clientWidth ?? 375;
      const scale = Math.min(1, containerW / img.naturalWidth, DISPLAY_MAX / img.naturalHeight);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      setDims({ w, h });
      // Default region: middle 40%x50% of the image (torso area)
      setRegion({
        x: w * 0.15,
        y: h * 0.15,
        width: w * 0.7,
        height: h * 0.6,
      });
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleAnalyze = useCallback(() => {
    if (!bitmapRef.current || !region || !dims) return;
    // Scale region from display coords back to bitmap coords
    const scaleX = bitmapRef.current.width / dims.w;
    const scaleY = bitmapRef.current.height / dims.h;
    const bitmapRegion: Rect = {
      x: region.x * scaleX,
      y: region.y * scaleY,
      width: region.width * scaleX,
      height: region.height * scaleY,
    };
    onAnalyze(bitmapRef.current, bitmapRegion);
  }, [region, dims, onAnalyze]);

  return (
    <div className="flex flex-col gap-4 px-4">
      <p className="text-zinc-400 text-sm text-center">
        Drag the box to cover your jacket, then tap Analyze.
      </p>

      <div ref={containerRef} className="relative mx-auto" style={dims ? { width: dims.w, height: dims.h } : {}}>
        {objectUrl && dims && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={objectUrl}
            alt="Captured suit"
            style={{ width: dims.w, height: dims.h, display: "block" }}
            className="rounded-xl"
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
