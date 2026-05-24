// Single source of truth for map marker / cluster colors, shared by the three
// renderers (Map.vue = Leaflet, MapGL.vue = MapLibre GL, Osd.vue = OpenSeadragon
// overlays) so the views stay visually identical and on-brand. JS consumers
// import `mapColors`; the same values are mirrored in Osd.vue's scoped CSS (kept
// in sync by hand — noted there) since CSS cannot import this module.
//
// Palette: default markers/clusters use the brand accent teal; the selected
// state uses a high-contrast warm red (DS danger token) so it pops on both pale
// modern tiles and sepia historical imagery; current-location uses brand indigo.
export const mapColors = {
  marker: "#4a9aa7", // accent-400 — default annotation marker
  markerSelected: "#dc2626", // selected / active marker (high contrast)
  markerStroke: "#ffffff",
  clusterSmall: "#4a9aa7", // accent-400
  clusterMedium: "#3d808b", // accent-500
  clusterLarge: "#2d6d78", // accent-700
  clusterText: "#ffffff",
  currentLocation: "#5e73d0", // indigo-400 — "you are here"
  focus: "#dc2626", // geocoding result pin
} as const;

export function useMapColors() {
  return mapColors;
}
