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
  if (Array.isArray(u)) return u[0] ?? "";
  return u ?? "";
}

/**
 * Whether a manifest reload is warranted. Only the manifest URL matters;
 * locale-only route changes keep `u` identical and must return false.
 */
export function shouldReloadManifest(prev: string, next: string): boolean {
  return prev !== next;
}
