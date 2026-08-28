import { describe, it, expect } from "vitest";
import { analyze } from "../lib/color/pipeline";
import { rgbToLab } from "../lib/color/space";

function makeBitmap(width: number, height: number, r: number, g: number, b: number): ImageBitmap {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }
  return { width, height, _data: data } as unknown as ImageBitmap;
}

const FULL_RECT = { x: 0, y: 0, width: 200, height: 200 };

describe("analyze (pipeline)", () => {
  it("solid-navy image returns lab close to navy, confidence > 0", () => {
    const img = makeBitmap(200, 200, 26, 39, 68);
    const result = analyze(img, FULL_RECT);
    const expected = rgbToLab(26, 39, 68);
    expect(result.lab[0]).toBeCloseTo(expected.l, 0);
    expect(result.lab[1]).toBeCloseTo(expected.a, 0);
    expect(result.lab[2]).toBeCloseTo(expected.b, 0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.swatchHex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("all-white image → low lightingQuality due to blown-out pixels", () => {
    const img = makeBitmap(200, 200, 255, 255, 255);
    const result = analyze(img, FULL_RECT);
    expect(result.lightingQuality).toBeLessThan(0.5);
  });

  it("returns all required fields with numbers in range", () => {
    const img = makeBitmap(200, 200, 100, 80, 60);
    const result = analyze(img, FULL_RECT);
    expect(Array.isArray(result.lab)).toBe(true);
    expect(result.lab).toHaveLength(3);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.lightingQuality).toBeGreaterThanOrEqual(0);
    expect(result.lightingQuality).toBeLessThanOrEqual(1);
    expect(result.jacketVisibility).toBeGreaterThanOrEqual(0);
    expect(result.jacketVisibility).toBeLessThanOrEqual(1);
    expect(result.colorConsistency).toBeGreaterThanOrEqual(0);
    expect(result.colorConsistency).toBeLessThanOrEqual(1);
  });
});
