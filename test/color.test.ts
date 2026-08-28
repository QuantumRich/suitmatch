import { describe, it, expect } from "vitest";
import { median, trimmedMean, stddev, percentile } from "../lib/color/stats";
import { rgbToLab, labToHex, tupleToLab, labToTuple } from "../lib/color/space";
import { deltaE } from "../lib/color/distance";
import { deltaEToScore, scoreToCategory } from "../lib/color/score";
import { analyzeLighting } from "../lib/color/lighting";

// ─── Stats ───────────────────────────────────────────────────────────────────

describe("stats", () => {
  it("median of odd array", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("median of even array", () => {
    expect(median([4, 2, 3, 1])).toBe(2.5);
  });

  it("trimmedMean removes extremes", () => {
    const vals = [1, 5, 5, 5, 5, 5, 100];
    const tm = trimmedMean(vals, 0.15); // cut=1 from each end, removes 1 and 100
    expect(tm).toBeGreaterThan(4);
    expect(tm).toBeLessThan(10);
  });

  it("stddev of constant array is 0", () => {
    expect(stddev([5, 5, 5])).toBe(0);
  });

  it("percentile p=50 equals median", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(percentile(arr, 50)).toBeCloseTo(median(arr), 5);
  });

  it("handles empty array gracefully", () => {
    expect(median([])).toBe(0);
    expect(trimmedMean([])).toBe(0);
    expect(stddev([])).toBe(0);
    expect(percentile([], 50)).toBe(0);
  });

  it("percentile p=0 returns minimum, p=100 returns maximum", () => {
    const arr = [3, 1, 4, 1, 5, 9];
    expect(percentile(arr, 0)).toBe(1);
    expect(percentile(arr, 100)).toBe(9);
  });

  it("stddev of single-element array is 0", () => {
    expect(stddev([42])).toBe(0);
  });

  it("trimmedMean with high fraction falls back to middle element", () => {
    const vals = [1, 2, 3];
    // trimFraction=0.5 → cut=1 from each side → trimmed=[] → fallback to median element
    const result = trimmedMean(vals, 0.5);
    expect(typeof result).toBe("number");
    expect(isNaN(result)).toBe(false);
  });
});

// ─── Color space ─────────────────────────────────────────────────────────────

describe("color space", () => {
  it("white rgb → Lab ~(100, 0, 0)", () => {
    const lab = rgbToLab(255, 255, 255);
    expect(lab.l).toBeGreaterThan(99);
    expect(Math.abs(lab.a)).toBeLessThan(1);
    expect(Math.abs(lab.b)).toBeLessThan(1);
  });

  it("black rgb → Lab ~(0, 0, 0)", () => {
    const lab = rgbToLab(0, 0, 0);
    expect(lab.l).toBeLessThan(1);
  });

  it("navy swatch has low L*, negative b*", () => {
    // #1a2744 — a typical navy
    const lab = rgbToLab(26, 39, 68);
    expect(lab.l).toBeLessThan(20);
    expect(lab.b).toBeLessThan(0); // blue-ish = negative b*
  });

  it("labToHex round-trip is close for navy", () => {
    const lab = rgbToLab(26, 39, 68);
    const hex = labToHex(lab);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    // Should be dark and bluish
    const r = parseInt(hex.slice(1, 3), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    expect(b).toBeGreaterThan(r);
    expect(r).toBeLessThan(60);
  });

  it("tuple round-trip", () => {
    const lab = { l: 30, a: -5, b: -20 };
    const t = labToTuple(lab);
    const back = tupleToLab(t);
    expect(back.l).toBe(30);
    expect(back.a).toBe(-5);
    expect(back.b).toBe(-20);
  });
});

// ─── CIEDE2000 ───────────────────────────────────────────────────────────────

describe("CIEDE2000", () => {
  it("identical colors have ΔE = 0", () => {
    const navy = rgbToLab(26, 39, 68);
    expect(deltaE(navy, navy)).toBe(0);
  });

  it("white vs black has large ΔE", () => {
    const white = rgbToLab(255, 255, 255);
    const black = rgbToLab(0, 0, 0);
    expect(deltaE(white, black)).toBeGreaterThan(90);
  });

  it("similar navies have small ΔE", () => {
    const navy1 = rgbToLab(26, 39, 68);
    const navy2 = rgbToLab(28, 41, 72);
    expect(deltaE(navy1, navy2)).toBeLessThan(3);
  });

  it("navy vs royal blue has noticeable ΔE", () => {
    const navy = rgbToLab(26, 39, 68);
    const royal = rgbToLab(65, 105, 225);
    expect(deltaE(navy, royal)).toBeGreaterThan(20);
  });

  it("navy vs black is noticeably different", () => {
    const navy = rgbToLab(26, 39, 68);
    const black = rgbToLab(20, 20, 20);
    expect(deltaE(navy, black)).toBeGreaterThan(5);
  });

  it("is symmetric", () => {
    const a = rgbToLab(50, 60, 80);
    const b = rgbToLab(55, 65, 85);
    expect(deltaE(a, b)).toBeCloseTo(deltaE(b, a), 8);
  });
});

// ─── Score mapping ────────────────────────────────────────────────────────────

describe("score mapping", () => {
  it("ΔE=0 produces 100", () => {
    expect(deltaEToScore(0)).toBe(100);
  });

  it("larger ΔE never produces a higher score", () => {
    const scores = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20].map(deltaEToScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("ΔE=15 produces a poor score", () => {
    expect(deltaEToScore(15)).toBeLessThan(60);
  });

  it("ΔE=1 produces excellent category", () => {
    expect(scoreToCategory(deltaEToScore(1))).toBe("excellent");
  });

  it("ΔE=5 produces borderline or better", () => {
    const score = deltaEToScore(5);
    const cat = scoreToCategory(score);
    expect(["excellent", "good", "borderline"]).toContain(cat);
  });

  it("score is clamped to 0..100", () => {
    const s1 = deltaEToScore(-5);
    const s2 = deltaEToScore(100);
    expect(s1).toBeLessThanOrEqual(100);
    expect(s2).toBeGreaterThanOrEqual(0);
  });

  it("deltaEToScore is monotone non-increasing over dense grid 0..30", () => {
    const deltas = Array.from({ length: 121 }, (_, i) => i * 0.25);
    const scores = deltas.map(deltaEToScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("scoreToCategory boundary at 90 is excellent", () => {
    expect(scoreToCategory(90)).toBe("excellent");
    expect(scoreToCategory(89)).toBe("good");
  });

  it("scoreToCategory boundary at 80 is good", () => {
    expect(scoreToCategory(80)).toBe("good");
    expect(scoreToCategory(79)).toBe("borderline");
  });

  it("scoreToCategory boundary at 65 is borderline", () => {
    expect(scoreToCategory(65)).toBe("borderline");
    expect(scoreToCategory(64)).toBe("poor");
  });
});

// ─── Lighting ─────────────────────────────────────────────────────────────────

describe("lighting analysis", () => {
  function makePixels(count: number, l: number, a = 0, b = 0) {
    return Array.from({ length: count }, () => ({ l, a, b }));
  }

  it("very dark pixels give low quality", () => {
    const { lightingQuality } = analyzeLighting(makePixels(100, 5));
    expect(lightingQuality).toBeLessThan(0.4);
  });

  it("blown-out pixels give low quality", () => {
    const { lightingQuality } = analyzeLighting(makePixels(100, 95));
    expect(lightingQuality).toBeLessThan(0.5);
  });

  it("neutral mid-range gives high quality", () => {
    const { lightingQuality } = analyzeLighting(makePixels(100, 50));
    expect(lightingQuality).toBeGreaterThan(0.65);
  });

  it("strong warm cast detected", () => {
    const pixels = makePixels(100, 50, 5, 20);
    const { castLabel } = analyzeLighting(pixels);
    expect(castLabel).toBe("warm");
  });

  it("handles empty pixels", () => {
    const { lightingQuality } = analyzeLighting([]);
    expect(lightingQuality).toBe(0);
  });
});
