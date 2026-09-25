/**
 * Helpers for deciding when the viewer must (re)load a manifest.
 *
 * The viewer renders whatever manifest is referenced by the `u` query
 * parameter. Re-fetching that manifest tears the panes down and rebuilds them
 * (`useViewer().display()` calls `init()` → `ready=false`), so it must happen
 * ONLY when `u` actually changes — never on an incidental route change.
 *
 * The bug this guards against: switching the UI language is a client-side route
 * change (`/?u=…` → `/ja?u=…`). The path changes but `u` is identical. If the
 * reload is keyed on the full path, the language switch needlessly rebuilds the
 * panes and the restored view (center / rotation / selected id) desyncs.
 */

/**
 * Resolve the manifest URL from the raw `u` query value.
 * Repeated query keys arrive as an array → take the first; missing → "".
 */
export function normalizeManifestUrl(
  u: string | string[] | undefined | null
): string {
  const raw = Array.isArray(u) ? (u[0] ?? "") : (u ?? "");
  return rewriteOldHost(raw);
}

/**
 * The viewer's own sample files moved from nakamura196.github.io/iiif_geo/ to
 * geo.ldas.jp/ (2026-09). GitHub Pages answers the old address with a 301 that
 * carries no `Access-Control-Allow-Origin`, and a browser refuses to follow a
 * cross-origin redirect without it — so `?u=<old address>` fails to load even
 * though the redirect itself works. Point such URLs straight at the new host.
 */
const OLD_BASES = [
  "https://nakamura196.github.io/iiif_geo/",
  "http://nakamura196.github.io/iiif_geo/",
];
const NEW_BASE = "https://geo.ldas.jp/";

export function rewriteOldHost(url: string): string {
  for (const old of OLD_BASES) {
    if (url.startsWith(old)) return NEW_BASE + url.slice(old.length);
  }
  return url;
}

/**
 * Whether a manifest reload is warranted. Only the manifest URL matters;
 * locale-only route changes keep `u` identical and must return false.
 */
export function shouldReloadManifest(prev: string, next: string): boolean {
  return prev !== next;
}
