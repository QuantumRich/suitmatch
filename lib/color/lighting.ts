import type { LabColor } from "./space";

export type LightingAnalysis = {
  lightingQuality: number;   // 0..1
  castA: number;             // mean a* (negative = green, positive = red)
  castB: number;             // mean b* (negative = blue, positive = yellow)
  meanL: number;
  clippedHighFraction: number;
  clippedLowFraction: number;
  castLabel: string;
};

export function analyzeLighting(labPixels: LabColor[]): LightingAnalysis {
  if (labPixels.length === 0) {
    return {
      lightingQuality: 0,
      castA: 0,
      castB: 0,
      meanL: 0,
      clippedHighFraction: 1,
      clippedLowFraction: 1,
      castLabel: "unknown",
    };
  }

  const meanL = labPixels.reduce((s, p) => s + p.l, 0) / labPixels.length;
  const meanA = labPixels.reduce((s, p) => s + p.a, 0) / labPixels.length;
  const meanB = labPixels.reduce((s, p) => s + p.b, 0) / labPixels.length;

  const clippedHigh = labPixels.filter((p) => p.l > 92).length;
  const clippedLow = labPixels.filter((p) => p.l < 5).length;
  const clippedHighFraction = clippedHigh / labPixels.length;
  const clippedLowFraction = clippedLow / labPixels.length;

  // Penalize bad brightness
  let brightnessPenalty = 0;
  if (meanL < 15) brightnessPenalty = 0.7;       // too dark
  else if (meanL < 25) brightnessPenalty = 0.3;
  else if (meanL > 85) brightnessPenalty = 0.6;  // blown out
  else if (meanL > 75) brightnessPenalty = 0.2;

  const clipPenalty = Math.min(1, (clippedHighFraction + clippedLowFraction) * 3);

  // Cast magnitude
  const castMag = Math.sqrt(meanA ** 2 + meanB ** 2);
  const castPenalty = Math.min(0.8, castMag / 20);

  const lightingQuality = Math.max(
    0,
    1 - brightnessPenalty - clipPenalty * 0.4 - castPenalty * 0.3
  );

  const castLabel = getCastLabel(meanA, meanB, castMag);

  return {
    lightingQuality,
    castA: meanA,
    castB: meanB,
    meanL,
    clippedHighFraction,
    clippedLowFraction,
    castLabel,
  };
}

function getCastLabel(a: number, b: number, mag: number): string {
  if (mag < 5) return "neutral";
  if (b > 8) return "warm";
  if (b < -8) return "cool";
  if (a > 5) return "reddish";
  if (a < -5) return "greenish";
  return "slight cast";
}

export function lightingQualityLabel(q: number): string {
  if (q >= 0.65) return "Good";
  if (q >= 0.40) return "OK";
  return "Poor";
}
