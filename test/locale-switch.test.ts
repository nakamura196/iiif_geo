import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (rel: string) => readFileSync(`${root}${rel}`, "utf8");

/**
 * Regression guard for the language-switch view desync.
 *
 * Background: switching the UI language is a client-side route change
 * (`/?u=…` → `/ja?u=…`). The manifest reload in pages/index.vue must be keyed
 * on the `u` query parameter, NOT on the full route path — otherwise every
 * language switch tears the panes down and rebuilds them, desyncing the view
 * restored from the URL (center / rotation / selected id).
 */
describe("language switch does not reload the manifest (index.vue)", () => {
  const src = read("pages/index.vue");

  it("keys the manifest reload on the `u` query parameter", () => {
    expect(src).toContain("normalizeManifestUrl(route.query.u");
  });

  it("does not watch the full route path for reloads (the regressed pattern)", () => {
    // The watch getter `() => route.fullPath` is the regression; a prose mention
    // of route.fullPath in a comment is fine, so match the code pattern only.
    expect(src).not.toMatch(/=>\s*route\.fullPath/);
  });

  it("imports the manifest-url helper rather than re-deriving inline", () => {
    expect(src).toMatch(
      /import\s*\{[^}]*normalizeManifestUrl[^}]*\}\s*from\s*["']~\/utils\/manifestUrl["']/
    );
  });
});
