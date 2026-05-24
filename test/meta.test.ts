import { describe, it, expect } from "vitest";
import { headConfig } from "~/meta.config";

// Guards the OGP/social-card regressions fixed in this work: the og:image must
// be a broadly-supported raster (not WebP, which X/Facebook/LINE don't render),
// dimensions must be present, and a favicon cache-buster must exist.
describe("meta.config (OGP / favicon)", () => {
  it("og:image is a JPG/PNG, not WebP", () => {
    expect(headConfig.image).toMatch(/\.(jpe?g|png)$/);
    expect(headConfig.image).not.toMatch(/\.webp$/);
  });

  it("og:image has explicit dimensions and type", () => {
    expect(typeof headConfig.imageWidth).toBe("number");
    expect(typeof headConfig.imageHeight).toBe("number");
    expect(headConfig.imageWidth).toBeGreaterThan(0);
    expect(headConfig.imageHeight).toBeGreaterThan(0);
    expect(headConfig.imageType).toMatch(/^image\//);
  });

  it("favicon has a cache-busting version", () => {
    expect(String(headConfig.faviconVersion ?? "").trim()).not.toBe("");
  });
});
