import { describe, it, expect } from "vitest";
import { mapColors, useMapColors } from "~/composables/useMapColors";

// useMapColors is the single source of truth that keeps the three map renderers
// (Leaflet / MapLibre / OSD) in sync. Guard its shape and that the values are
// valid colors so a refactor can't silently drop or corrupt the palette.
const REQUIRED = [
  "marker",
  "markerSelected",
  "markerStroke",
  "clusterSmall",
  "clusterMedium",
  "clusterLarge",
  "clusterText",
  "currentLocation",
  "focus",
] as const;

const isHex = (v: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

describe("useMapColors palette", () => {
  it("exposes all required color keys", () => {
    for (const key of REQUIRED)
      expect(mapColors, `missing color: ${key}`).toHaveProperty(key);
  });

  it("every value is a valid hex color", () => {
    for (const [key, value] of Object.entries(mapColors))
      expect(isHex(value), `${key}=${value} is not a valid hex`).toBe(true);
  });

  it("selected and default markers are distinct (selection stays visible)", () => {
    expect(mapColors.markerSelected).not.toBe(mapColors.marker);
  });

  it("useMapColors() returns the same palette object", () => {
    expect(useMapColors()).toBe(mapColors);
  });
});
