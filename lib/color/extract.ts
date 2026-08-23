import { rgbToLab, type LabColor } from "./space";

export type Rect = { x: number; y: number; width: number; height: number };

const MAX_DIM = 512;

export function extractPixels(
  imageData: ImageData,
  rect: Rect
): LabColor[] {
  const { data, width, height } = imageData;
  const { x, y, width: rw, height: rh } = rect;

  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(width, Math.round(x + rw));
  const y1 = Math.min(height, Math.round(y + rh));

  const pixels: LabColor[] = [];
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (py * width + px) * 4;
      pixels.push(rgbToLab(data[i], data[i + 1], data[i + 2]));
    }
  }
  return pixels;
}

export function scaleRect(
  rect: Rect,
  origW: number,
  origH: number,
  scaledW: number,
  scaledH: number
): Rect {
  const sx = scaledW / origW;
  const sy = scaledH / origH;
  return {
    x: rect.x * sx,
    y: rect.y * sy,
    width: rect.width * sx,
    height: rect.height * sy,
  };
}

export function getScaledDimensions(
  origW: number,
  origH: number
): { w: number; h: number } {
  const scale = Math.min(1, MAX_DIM / Math.max(origW, origH));
  return { w: Math.round(origW * scale), h: Math.round(origH * scale) };
}
