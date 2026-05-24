import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (rel: string) => readFileSync(`${root}${rel}`, "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = `${dir}/${name}`;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(vue|ts|js)$/.test(name)) out.push(p);
  }
  return out;
}
const sourceFiles = [...walk(`${root}components`), ...walk(`${root}pages`)];

describe("deploy config", () => {
  const pkg = JSON.parse(read("package.json"));

  it("references hi-design-system via a git tag, not a local file: path", () => {
    const dep = pkg.dependencies["hi-design-system"];
    expect(dep).toMatch(/^github:/);
    expect(dep).not.toMatch(/^file:/);
  });

  it("allowlists better-sqlite3 build (needed by @nuxt/content under pnpm)", () => {
    expect(pkg.pnpm?.onlyBuiltDependencies ?? []).toContain("better-sqlite3");
  });
});

describe("map color centralization", () => {
  // The old, off-brand / duplicated palette must not creep back into the panes.
  const OLD = [
    "#51bbd6",
    "#f1f075",
    "#f28cb1",
    "#3FB1CE",
    "#FF0000",
    "#FF4444",
    "#4080FF",
    "leaflet-color-markers",
  ];
  const panes = [
    "components/panes/Map.vue",
    "components/panes/MapGL.vue",
    "components/panes/Osd.vue",
  ];

  for (const file of panes) {
    it(`${file} has no legacy hardcoded map colors`, () => {
      const src = read(file).toLowerCase();
      const found = OLD.filter((c) => src.includes(c.toLowerCase()));
      expect(found, `legacy colors still present in ${file}`).toEqual([]);
    });
  }
});

describe("UX consistency guards", () => {
  it("no raw alert() in components or pages (use useToast instead)", () => {
    const offenders = sourceFiles.filter((f) => /\balert\(/.test(readFileSync(f, "utf8")));
    expect(offenders.map((f) => f.replace(root, ""))).toEqual([]);
  });

  it("no emoji glyph map controls remain", () => {
    const offenders = sourceFiles.filter((f) => readFileSync(f, "utf8").includes("📍"));
    expect(offenders.map((f) => f.replace(root, ""))).toEqual([]);
  });

  it("every dialog uses the shared DsDialogHeader", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      const src = readFileSync(file, "utf8");
      if (/<DsDialog[\s>]/.test(src) && !src.includes("DsDialogHeader")) {
        offenders.push(file.replace(root, ""));
      }
    }
    expect(offenders, "dialogs missing DsDialogHeader").toEqual([]);
  });
});
