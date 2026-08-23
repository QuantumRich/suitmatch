export type MatchCategory = "excellent" | "good" | "borderline" | "poor";

// Thresholds: tuned after real-world group test.
const BREAKPOINTS = [
  { maxDeltaE: 2, minScore: 95, maxScore: 100 },
  { maxDeltaE: 4, minScore: 85, maxScore: 94 },
  { maxDeltaE: 7, minScore: 70, maxScore: 84 },
  { maxDeltaE: 10, minScore: 60, maxScore: 69 },
] as const;

export function deltaEToScore(deltaE: number): number {
  if (deltaE <= 0) return 100;

  for (const bp of BREAKPOINTS) {
    if (deltaE <= bp.maxDeltaE) {
      const prevMax = BREAKPOINTS[BREAKPOINTS.indexOf(bp) - 1]?.maxDeltaE ?? 0;
      const t = (deltaE - prevMax) / (bp.maxDeltaE - prevMax);
      return Math.round(bp.maxScore - t * (bp.maxScore - bp.minScore));
    }
  }

  // ΔE > 10: map 10→60, 20→0 (clamped)
  const score = 60 - (deltaE - 10) * 6;
  return Math.max(0, Math.round(score));
}

export function scoreToCategory(score: number): MatchCategory {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 65) return "borderline";
  return "poor";
}

export function categoryLabel(cat: MatchCategory): string {
  switch (cat) {
    case "excellent": return "Excellent Match";
    case "good": return "Good Match";
    case "borderline": return "Borderline";
    case "poor": return "Poor Match";
  }
}
