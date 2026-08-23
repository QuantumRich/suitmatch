"use client";

import { useCallback, useRef, useState } from "react";
import type { Rect } from "@/lib/color/extract";

type Props = {
  containerWidth: number;
  containerHeight: number;
  initialRect: Rect;
  onChange: (rect: Rect) => void;
};

const MIN_SIZE = 40;

export default function JacketRegion({
  containerWidth,
  containerHeight,
  initialRect,
  onChange,
}: Props) {
  const [rect, setRect] = useState<Rect>(initialRect);
  const dragState = useRef<{
    type: "move" | "resize-br";
    startX: number;
    startY: number;
    startRect: Rect;
  } | null>(null);

  const update = useCallback(
    (newRect: Rect) => {
      const clamped: Rect = {
        x: Math.max(0, Math.min(newRect.x, containerWidth - MIN_SIZE)),
        y: Math.max(0, Math.min(newRect.y, containerHeight - MIN_SIZE)),
        width: Math.max(MIN_SIZE, Math.min(newRect.width, containerWidth - newRect.x)),
        height: Math.max(MIN_SIZE, Math.min(newRect.height, containerHeight - newRect.y)),
      };
      setRect(clamped);
      onChange(clamped);
    },
    [containerWidth, containerHeight, onChange]
  );

  function getClientXY(e: React.TouchEvent | React.MouseEvent) {
    if ("touches" in e) {
      return { cx: e.touches[0].clientX, cy: e.touches[0].clientY };
    }
    return { cx: e.clientX, cy: e.clientY };
  }

  function onDragStart(
    e: React.TouchEvent | React.MouseEvent,
    type: "move" | "resize-br"
  ) {
    e.stopPropagation();
    const { cx, cy } = getClientXY(e);
    dragState.current = { type, startX: cx, startY: cy, startRect: { ...rect } };
  }

  function onDragMove(e: React.TouchEvent | React.MouseEvent) {
    if (!dragState.current) return;
    const { cx, cy } = getClientXY(e);
    const { type, startX, startY, startRect } = dragState.current;
    const dx = cx - startX;
    const dy = cy - startY;

    if (type === "move") {
      update({ ...startRect, x: startRect.x + dx, y: startRect.y + dy });
    } else {
      update({ ...startRect, width: startRect.width + dx, height: startRect.height + dy });
    }
  }

  function onDragEnd() {
    dragState.current = null;
  }

  const { x, y, width, height } = rect;

  return (
    <div
      className="absolute inset-0"
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
    >
      {/* Dimmed overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: containerWidth, height: containerHeight }}
      >
        <defs>
          <mask id="cutout">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={width} height={height} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#cutout)"
        />
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      </svg>

      {/* Drag handle — move */}
      <div
        className="absolute touch-none cursor-move"
        style={{ left: x, top: y, width, height }}
        onMouseDown={(e) => onDragStart(e, "move")}
        onTouchStart={(e) => onDragStart(e, "move")}
      />

      {/* Resize handle — bottom-right */}
      <div
        className="absolute touch-none cursor-se-resize bg-blue-500 rounded-full"
        style={{
          left: x + width - 14,
          top: y + height - 14,
          width: 28,
          height: 28,
        }}
        onMouseDown={(e) => onDragStart(e, "resize-br")}
        onTouchStart={(e) => onDragStart(e, "resize-br")}
      />

      {/* Label */}
      <div
        className="absolute text-blue-300 text-xs font-semibold bg-black/60 px-2 py-0.5 rounded"
        style={{ left: x + 4, top: y + 4 }}
      >
        JACKET AREA
      </div>
    </div>
  );
}
