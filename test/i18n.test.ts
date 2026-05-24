import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import en from "~/i18n/locales/en.js";
import ja from "~/i18n/locales/ja.js";

const root = fileURLToPath(new URL("../", import.meta.url));

// Recursively collect source files under the given dirs.
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = `${dir}/${name}`;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(vue|ts|js)$/.test(name)) out.push(p);
  }
  return out;
}

describe("i18n locale integrity", () => {
  it("en and ja have identical key sets (no missing translations)", () => {
    const enKeys = Object.keys(en).sort();
    const jaKeys = Object.keys(ja).sort();
    const onlyEn = enKeys.filter((k) => !(k in ja));
    const onlyJa = jaKeys.filter((k) => !(k in en));
    expect(onlyEn, "keys in en.js missing from ja.js").toEqual([]);
    expect(onlyJa, "keys in ja.js missing from en.js").toEqual([]);
  });

  it("has no empty translation values", () => {
    for (const [k, v] of Object.entries(en))
      expect(String(v).trim(), `en.${k} is empty`).not.toBe("");
    for (const [k, v] of Object.entries(ja))
      expect(String(v).trim(), `ja.${k} is empty`).not.toBe("");
  });

  it("every literal t()/$t() key used in source exists in both locales", () => {
    const files = [
      ...walk(`${root}components`),
      ...walk(`${root}pages`),
      ...walk(`${root}composables`),
    ];
    const re = /\$?\bt\(\s*(['"])([^'"]+?)\1/g;
    const missing: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const key = m[2];
        // Skip obvious non-i18n / interpolated keys.
        if (key.includes("${") || key.includes("/")) continue;
        if (!(key in en) || !(key in ja)) {
          missing.push(`${key}  (${file.replace(root, "")})`);
        }
      }
    }
    expect(missing, "referenced i18n keys not defined in en+ja").toEqual([]);
  });
});
