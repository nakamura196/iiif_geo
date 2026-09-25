import { describe, it, expect } from "vitest";
import {
  normalizeManifestUrl,
  rewriteOldHost,
  shouldReloadManifest,
} from "~/utils/manifestUrl";

describe("normalizeManifestUrl", () => {
  it("returns a plain string unchanged", () => {
    expect(normalizeManifestUrl("https://example.org/m.json")).toBe(
      "https://example.org/m.json"
    );
  });

  it("collapses a repeated query key (array) to the first value", () => {
    expect(normalizeManifestUrl(["a.json", "b.json"])).toBe("a.json");
  });

  it("treats missing / empty values as an empty string", () => {
    expect(normalizeManifestUrl(undefined)).toBe("");
    expect(normalizeManifestUrl(null)).toBe("");
    expect(normalizeManifestUrl([])).toBe("");
  });
});

describe("shouldReloadManifest", () => {
  it("reloads when the manifest URL changes", () => {
    expect(shouldReloadManifest("a.json", "b.json")).toBe(true);
  });

  it("does NOT reload when the URL is identical (e.g. a locale-only route change)", () => {
    const u = "https://www.hi.u-tokyo.ac.jp/.../iiif_geo/manifest.json";
    expect(shouldReloadManifest(u, u)).toBe(false);
  });

  it("regression: a language switch keeps `u` identical → no reload", () => {
    // `/?u=M` → `/ja?u=M`: the path changes, the manifest URL does not.
    const fromEn = normalizeManifestUrl("M");
    const toJa = normalizeManifestUrl("M");
    expect(shouldReloadManifest(fromEn, toJa)).toBe(false);
  });
});

describe("rewriteOldHost", () => {
  it("points the old github.io address at geo.ldas.jp (the 301 there has no CORS header)", () => {
    expect(rewriteOldHost("https://nakamura196.github.io/iiif_geo/manifest.json")).toBe(
      "https://geo.ldas.jp/manifest.json"
    );
    expect(rewriteOldHost("http://nakamura196.github.io/iiif_geo/canvas.json")).toBe(
      "https://geo.ldas.jp/canvas.json"
    );
  });

  it("is applied by normalizeManifestUrl", () => {
    expect(normalizeManifestUrl("https://nakamura196.github.io/iiif_geo/manifest.json")).toBe(
      "https://geo.ldas.jp/manifest.json"
    );
  });

  it("leaves other URLs alone (other github.io projects, other hosts)", () => {
    for (const u of [
      "https://nakamura196.github.io/iiif_geo_other/manifest.json",
      "https://nakamura196.github.io/other/manifest.json",
      "https://annotations.allmaps.org/images/2e1d3f991aad6cb4",
      "https://geo.ldas.jp/manifest.json",
      "",
    ]) {
      expect(rewriteOldHost(u)).toBe(u);
    }
  });
});
