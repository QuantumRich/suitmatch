"use client";

import { aggregateSamples } from "./sample";
import { extractPixels, getScaledDimensions, scaleRect, type Rect } from "./extract";
import { analyzeLighting } from "./lighting";
import { labToHex, labToTuple } from "./space";

export type Measurement = {
  lab: [number, number, number];
  confidence: number;
  lightingQuality: number;
  jacketVisibility: number;
  colorConsistency: number;
  swatchHex: string;
};

export function analyze(image: ImageBitmap, region: Rect): Measurement {
  const { w, h } = getScaledDimensions(image.width, image.height);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  ctx.drawImage(image, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  // Scale region to match downscaled canvas
  const scaledRegion = scaleRect(region, image.width, image.height, w, h);

  // Sample jacket sub-regions
  const { representativeLab, colorConsistency, jacketVisibility, subRegions: _ } =
    aggregateSamples(imageData, scaledRegion);

  // Lighting analysis on the jacket region pixels (whole region for cast)
  const wholeRegionPixels = extractPixels(imageData, scaledRegion);
  const { lightingQuality } = analyzeLighting(wholeRegionPixels);

  // Weighted geometric mean for confidence; prevent any single bad factor from hiding
  const confidence = weightedGeometricMean([
    { value: lightingQuality, weight: 0.5 },
    { value: jacketVisibility, weight: 0.3 },
    { value: colorConsistency, weight: 0.2 },
  ]);

  const swatchHex = labToHex(representativeLab);

  return {
    lab: labToTuple(representativeLab),
    confidence: round2(confidence),
    lightingQuality: round2(lightingQuality),
    jacketVisibility: round2(jacketVisibility),
    colorConsistency: round2(colorConsistency),
    swatchHex,
  };
}

function weightedGeometricMean(
  factors: Array<{ value: number; weight: number }>
): number {
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const logSum = factors.reduce(
    (s, f) => s + f.weight * Math.log(Math.max(0.001, f.value)),
    0
  );
  return Math.exp(logSum / totalWeight);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
