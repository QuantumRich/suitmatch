import { extractPixels, type Rect } from "./extract";
import { median, stddev } from "./stats";
import type { LabColor } from "./space";

// L* thresholds for filtering
const L_HIGH = 85;
const L_LOW = 8;

function filterPixels(pixels: LabColor[]): LabColor[] {
  return pixels.filter((p) => p.l >= L_LOW && p.l <= L_HIGH);
}

function medianLab(pixels: LabColor[]): LabColor | null {
  if (pixels.length === 0) return null;
  const l = median(pixels.map((p) => p.l));
  const a = median(pixels.map((p) => p.a));
  const b = median(pixels.map((p) => p.b));
  return { l, a, b };
}

export type SubRegionResult = {
  label: string;
  lab: LabColor | null;
  sampleCount: number;
  filteredCount: number;
};

// Divide rect into 5 sub-regions
export function getSubRegions(rect: Rect): Array<{ label: string; rect: Rect }> {
  const { x, y, width: w, height: h } = rect;
  const hw = w / 2;
  const third = h / 3;

  return [
    { label: "left-chest",    rect: { x, y: y + third * 0.2, width: hw * 0.9, height: third * 0.8 } },
    { label: "right-chest",   rect: { x: x + hw * 1.1, y: y + third * 0.2, width: hw * 0.9, height: third * 0.8 } },
    { label: "left-shoulder", rect: { x, y, width: hw * 0.9, height: third * 0.5 } },
    { label: "right-shoulder",rect: { x: x + hw * 1.1, y, width: hw * 0.9, height: third * 0.5 } },
    { label: "lower-jacket",  rect: { x, y: y + third * 1.7, width: w, height: third * 1.1 } },
  ];
}

export function sampleSubRegions(
  imageData: ImageData,
  rect: Rect
): SubRegionResult[] {
  const subRegions = getSubRegions(rect);
  return subRegions.map(({ label, rect: sr }) => {
    const raw = extractPixels(imageData, sr);
    const filtered = filterPixels(raw);
    return {
      label,
      lab: medianLab(filtered),
      sampleCount: raw.length,
      filteredCount: filtered.length,
    };
  });
}

export type SampleResult = {
  representativeLab: LabColor;
  colorConsistency: number;  // 0..1
  jacketVisibility: number;  // 0..1
  subRegions: SubRegionResult[];
};

export function aggregateSamples(
  imageData: ImageData,
  rect: Rect
): SampleResult {
  const subRegions = sampleSubRegions(imageData, rect);
  const valid = subRegions.filter((sr) => sr.lab !== null && sr.filteredCount > 10);

  const totalSampled = subRegions.reduce((s, sr) => s + sr.sampleCount, 0);
  const totalFiltered = subRegions.reduce((s, sr) => s + sr.filteredCount, 0);
  const jacketVisibility = totalSampled > 0
    ? Math.min(1, totalFiltered / totalSampled)
    : 0;

  if (valid.length === 0) {
    return {
      representativeLab: { l: 0, a: 0, b: 0 },
      colorConsistency: 0,
      jacketVisibility,
      subRegions,
    };
  }

  const labs = valid.map((sr) => sr.lab!);
  const repLab = medianLab(labs)!;

  // Consistency: how tight are the sub-region medians?
  const lStd = stddev(labs.map((p) => p.l));
  const aStd = stddev(labs.map((p) => p.a));
  const bStd = stddev(labs.map((p) => p.b));
  const avgStd = (lStd + aStd + bStd) / 3;
  const colorConsistency = Math.max(0, 1 - avgStd / 15);

  return {
    representativeLab: repLab,
    colorConsistency,
    jacketVisibility,
    subRegions,
  };
}
