import { describe, it, expect } from "vitest";
import {
  calculateImageRotation,
  findNearestThreePoints,
  calculateLocalRotation,
  type Feature,
} from "~/utils/calculateImageRotation";

// Build a control point: image (resource) coords + geographic coords.
const f = (rx: number, ry: number, lng: number, lat: number): Feature => ({
  properties: { resourceCoords: [rx, ry] },
  geometry: { coordinates: [lng, lat] },
});

describe("calculateImageRotation", () => {
  it("returns null with fewer than 2 valid points", () => {
    expect(calculateImageRotation([])).toBeNull();
    expect(calculateImageRotation([f(0, 0, 139, 35)])).toBeNull();
  });

  it("ignores invalid features (missing coords)", () => {
    const invalid = { properties: {}, geometry: {} } as Feature;
    expect(calculateImageRotation([f(0, 0, 139, 35), invalid])).toBeNull();
  });

  it("computes a known rotation (image diagonal vs eastward geo) ≈ -135°", () => {
    const r = calculateImageRotation([
      f(0, 0, 139, 35),
      f(100, 100, 140, 35),
    ]);
    expect(r).not.toBeNull();
    expect(r!.rotation).toBeCloseTo(-135, 1);
  });

  it("computes 0° when image x-axis already maps to geographic north", () => {
    const r = calculateImageRotation([
      f(0, 0, 139, 35),
      f(100, 0, 139, 36),
    ]);
    expect(r!.rotation).toBeCloseTo(0, 1);
  });

  it("always returns rotation within [-180, 180]", () => {
    for (const [lng, lat] of [
      [140, 36],
      [138, 34],
      [139.5, 35.0001],
      [141, 35],
    ] as const) {
      const r = calculateImageRotation([f(0, 0, 139, 35), f(50, -30, lng, lat)]);
      expect(r!.rotation).toBeGreaterThanOrEqual(-180);
      expect(r!.rotation).toBeLessThanOrEqual(180);
    }
  });
});

describe("findNearestThreePoints", () => {
  it("returns all valid points when fewer than 3", () => {
    const pts = [f(0, 0, 139, 35), f(1, 1, 139, 35)];
    expect(findNearestThreePoints(pts, [0, 0])).toHaveLength(2);
  });

  it("returns the 3 nearest points by resource coords", () => {
    const pts = [f(0, 0, 139, 35), f(1, 1, 139, 35), f(10, 10, 139, 35), f(20, 20, 139, 35)];
    const near = findNearestThreePoints(pts, [0, 0]);
    expect(near).toHaveLength(3);
    expect(near.map((p) => p.properties.resourceCoords)).toEqual([
      [0, 0],
      [1, 1],
      [10, 10],
    ]);
  });
});

describe("calculateLocalRotation", () => {
  it("returns null with fewer than 2 valid points", () => {
    expect(calculateLocalRotation([f(0, 0, 139, 35)])).toBeNull();
  });

  it("uses the farthest pair for 3 collinear points (≈ -135°)", () => {
    const r = calculateLocalRotation([
      f(0, 0, 139, 35),
      f(50, 50, 139.5, 35),
      f(100, 100, 140, 35),
    ]);
    expect(r!.rotation).toBeCloseTo(-135, 1);
  });
});
