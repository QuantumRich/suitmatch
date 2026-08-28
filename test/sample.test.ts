import { describe, it, expect } from "vitest";
import { getSubRegions, sampleSubRegions, aggregateSamples } from "../lib/color/sample";
import { rgbToLab } from "../lib/color/space";
import type { Rect } from "../lib/color/extract";

function makeImageData(width: number, height: number, r: number, g: number, b: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }
  return { data, width, height } as unknown as ImageData;
}

function makeImageDataHalves(
  width: number, height: number,
  topR: number, topG: number, topB: number,
  botR: number, botG: number, botB: number,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  const half = Math.floor(height / 2);
  for (let y = 0; y < height; y++) {
    const [r, g, b] = y < half ? [topR, topG, topB] : [botR, botG, botB];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height } as unknown as ImageData;
}

const BASE_RECT: Rect = { x: 0, y: 0, width: 200, height: 300 };

describe("getSubRegions", () => {
  it("returns 5 regions with correct labels", () => {
    const regions = getSubRegions(BASE_RECT);
    expect(regions).toHaveLength(5);
    const labels = regions.map((r) => r.label);
    expect(labels).toContain("left-chest");
    expect(labels).toContain("right-chest");
    expect(labels).toContain("left-shoulder");
    expect(labels).toContain("right-shoulder");
    expect(labels).toContain("lower-jacket");
  });

  it("all sub-rects are within the parent rect", () => {
    const regions = getSubRegions(BASE_RECT);
    for (const { label, rect: r } of regions) {
      expect(r.x).toBeGreaterThanOrEqual(BASE_RECT.x);
      expect(r.y).toBeGreaterThanOrEqual(BASE_RECT.y);
      expect(r.x + r.width).toBeLessThanOrEqual(BASE_RECT.x + BASE_RECT.width + 0.001);
      expect(r.y + r.height).toBeLessThanOrEqual(BASE_RECT.y + BASE_RECT.height + 0.001);
    }
  });

  it("left-chest and right-chest do not overlap", () => {
    const regions = getSubRegions(BASE_RECT);
    const lc = regions.find((r) => r.label === "left-chest")!.rect;
    const rc = regions.find((r) => r.label === "right-chest")!.rect;
    expect(lc.x + lc.width).toBeLessThanOrEqual(rc.x + 0.001);
  });

  it("left-shoulder and right-shoulder do not overlap", () => {
    const regions = getSubRegions(BASE_RECT);
    const ls = regions.find((r) => r.label === "left-shoulder")!.rect;
    const rs = regions.find((r) => r.label === "right-shoulder")!.rect;
    expect(ls.x + ls.width).toBeLessThanOrEqual(rs.x + 0.001);
  });

  it("left-chest and right-chest are symmetric", () => {
    const regions = getSubRegions(BASE_RECT);
    const lc = regions.find((r) => r.label === "left-chest")!.rect;
    const rc = regions.find((r) => r.label === "right-chest")!.rect;
    const leftGap = lc.x - BASE_RECT.x;
    const rightGap = (BASE_RECT.x + BASE_RECT.width) - (rc.x + rc.width);
    expect(leftGap).toBeCloseTo(rightGap, 5);
    expect(lc.width).toBeCloseTo(rc.width, 5);
  });

  it("left-shoulder and right-shoulder are symmetric", () => {
    const regions = getSubRegions(BASE_RECT);
    const ls = regions.find((r) => r.label === "left-shoulder")!.rect;
    const rs = regions.find((r) => r.label === "right-shoulder")!.rect;
    const leftGap = ls.x - BASE_RECT.x;
    const rightGap = (BASE_RECT.x + BASE_RECT.width) - (rs.x + rs.width);
    expect(leftGap).toBeCloseTo(rightGap, 5);
    expect(ls.width).toBeCloseTo(rs.width, 5);
  });
});

describe("sampleSubRegions", () => {
  it("solid navy image: all sub-regions return navy Lab, filteredCount > 0", () => {
    const imgData = makeImageData(200, 300, 26, 39, 68);
    const navyLab = rgbToLab(26, 39, 68);
    const results = sampleSubRegions(imgData, BASE_RECT);
    expect(results).toHaveLength(5);
    for (const sr of results) {
      expect(sr.filteredCount).toBeGreaterThan(0);
      if (sr.lab) {
        expect(sr.lab.l).toBeCloseTo(navyLab.l, 0);
        expect(sr.lab.a).toBeCloseTo(navyLab.a, 0);
        expect(sr.lab.b).toBeCloseTo(navyLab.b, 0);
      }
    }
  });
});

describe("aggregateSamples", () => {
  it("solid-color image → high colorConsistency and jacketVisibility", () => {
    const imgData = makeImageData(200, 300, 80, 50, 20);
    const result = aggregateSamples(imgData, BASE_RECT);
    expect(result.colorConsistency).toBeGreaterThanOrEqual(0.9);
    expect(result.jacketVisibility).toBeGreaterThan(0);
  });

  it("mixed image (red top, blue bottom) → lower colorConsistency", () => {
    const imgData = makeImageDataHalves(200, 300, 180, 10, 10, 10, 10, 180);
    const result = aggregateSamples(imgData, BASE_RECT);
    expect(result.colorConsistency).toBeLessThan(0.7);
  });

  it("near-black image (all below L_LOW) → fallback zero Lab, zero consistency", () => {
    // L* for (5,5,5) ≈ 2.2, well below L_LOW=8
    const imgData = makeImageData(200, 300, 5, 5, 5);
    const result = aggregateSamples(imgData, BASE_RECT);
    expect(result.colorConsistency).toBe(0);
    expect(result.representativeLab.l).toBe(0);
    expect(result.representativeLab.a).toBe(0);
    expect(result.representativeLab.b).toBe(0);
  });
});
