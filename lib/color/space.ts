import { converter, formatHex } from "culori";

const toLab = converter("lab");
const toRgb = converter("rgb");

export type LabColor = { l: number; a: number; b: number };

export function rgbToLab(r: number, g: number, b: number): LabColor {
  // culori expects 0..1 for rgb
  const labColor = toLab({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
  if (!labColor) return { l: 0, a: 0, b: 0 };
  return { l: labColor.l ?? 0, a: labColor.a ?? 0, b: labColor.b ?? 0 };
}

export function labToHex(lab: LabColor): string {
  const rgb = toRgb({ mode: "lab", l: lab.l, a: lab.a, b: lab.b });
  if (!rgb) return "#000000";
  const hex = formatHex({ mode: "rgb", r: rgb.r, g: rgb.g, b: rgb.b });
  return hex ?? "#000000";
}

export function labToTuple(lab: LabColor): [number, number, number] {
  return [lab.l, lab.a, lab.b];
}

export function tupleToLab(t: [number, number, number]): LabColor {
  return { l: t[0], a: t[1], b: t[2] };
}
