<script setup lang="ts">
import { Map, NavigationControl, type LngLatLike } from "maplibre-gl";
import {
  mdiLayers,
  mdiImage,
  mdiEye,
  mdiEyeOff,
  mdiViewSplitVertical,
  mdiClose,
} from "@mdi/js";
import "maplibre-gl/dist/maplibre-gl.css";
import { useResponsive } from "~/composables/useResponsive";

const { t } = useI18n();
const { mobile, mdAndUp } = useResponsive();
const route = useRoute();
const router = useRouter();

// State
const mapContainer = ref<HTMLDivElement>();
const mapInstance = ref<Map | null>(null);
const mapReady = ref(false);
const showLayerMenu = ref(false);
const showImageControls = ref(false);
const imageOpacity = ref(1.0);
const imageVisible = ref(true);

// Map configuration
const zoom_ = ref(6);
const center_ = ref<[number, number]>([128, 35]);

// IIIF Image data
const imageServiceId = ref<string>("");
const imageInfo = ref<any>(null);
const imageBounds = ref<[[number, number], [number, number]] | null>(null);
const imageRotation = ref(0);

// Settings composable
const { title, manifest, canvases } = useSettings();

// Map styles configuration
const mapStyles = ref([
  {
    id: "osm",
    name: "OpenStreetMap",
    style: {
      version: 8 as const,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        osm: {
          type: "raster" as const,
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
      },
      layers: [
        {
          id: "osm",
          type: "raster" as const,
          source: "osm"
        }
      ]
    },
    visible: true
  },
  {
    id: "gsi-pale",
    name: t("国土地理院ウェブサイト"),
    style: {
      version: 8 as const,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        gsi: {
          type: "raster" as const,
          tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: t("国土地理院ウェブサイト")
        }
      },
      layers: [
        {
          id: "gsi",
          type: "raster" as const,
          source: "gsi"
        }
      ]
    },
    visible: false
  },
  {
    id: "gsi-photo",
    name: t("空中写真"),
    style: {
      version: 8 as const,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        gsi: {
          type: "raster" as const,
          tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
          tileSize: 256,
          attribution: t("国土地理院ウェブサイト")
        }
      },
      layers: [
        {
          id: "gsi",
          type: "raster" as const,
          source: "gsi"
        }
      ]
    },
    visible: false
  },
  {
    id: "rekichizu",
    name: t("れきちず"),
    style: "https://mierune.github.io/rekichizu-style/styles/street/style.json",
    visible: false
  }
]);

const currentStyleIndex = ref(0);

// Load manifest and extract IIIF image
const loadManifest = async (url: string) => {
  if (!url) return;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.type === "Manifest" && data.items && data.items.length > 0) {
      manifest.value = data;

      // Get first canvas
      const canvas = data.items[0];

      // Extract IIIF image service URL
      const imageService = canvas.items?.[0]?.items?.[0]?.body?.service?.[0];
      if (imageService && imageService.id) {
        // Get image info
        const infoUrl = imageService.id + "/info.json";
        const infoResponse = await fetch(infoUrl);
        const infoData = await infoResponse.json();

        // Store service ID and info for dynamic tile requests
        imageServiceId.value = imageService.id;
        imageInfo.value = infoData;

        // Get geographic bounds from annotations
        if (canvas.annotations && canvas.annotations[0]) {
          const features = canvas.annotations[0].items?.[0]?.body?.features;

          if (features && features.length > 0) {
            // Calculate bounds from all features
            let minLng = Infinity;
            let maxLng = -Infinity;
            let minLat = Infinity;
            let maxLat = -Infinity;

            for (const feature of features) {
              if (feature.geometry?.coordinates) {
                const [lng, lat] = feature.geometry.coordinates;
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
              }
            }

            if (minLng !== Infinity) {
              imageBounds.value = [[minLng, minLat], [maxLng, maxLat]];

              // Set map center and zoom to image bounds
              center_.value = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
            }
          }
        }

        // Set title
        if (data.label) {
          const labels = [];
          for (const key in data.label) {
            if (data.label[key]) {
              labels.push(data.label[key][0]);
            }
          }
          title.value = labels.join(" ");
        }
      }
    }
  } catch (e) {
    console.error("Failed to load manifest:", e);
  }
};

// Add IIIF image as overlay on the map using dynamic tiling
const addImageOverlay = async () => {
  if (!mapInstance.value || !imageServiceId.value || !imageBounds.value || !imageInfo.value) {
    return;
  }

  const map = mapInstance.value;

  const imageWidth = imageInfo.value.width;
  const imageHeight = imageInfo.value.height;
  const bounds = imageBounds.value;

  // Check if the IIIF server supports tiling
  const iiifTiles = imageInfo.value.tiles;
  const supportsTiling = iiifTiles && iiifTiles.length > 0;

  console.log('[Debug] Tiling support check:', {
    iiifTiles,
    supportsTiling,
    tilesLength: iiifTiles?.length
  });

  // Remove existing source and layer if they exist
  if (map.getLayer('iiif-image-layer')) {
    map.removeLayer('iiif-image-layer');
  }
  if (map.getSource('iiif-image')) {
    map.removeSource('iiif-image');
  }

  try {
    // Use true tiling with geographic coordinate transformation
    if (supportsTiling && iiifTiles && iiifTiles.length > 0) {
      const tileInfo = iiifTiles[0];
      const tileWidth = tileInfo.width || 256;

      // Build tile URL template with all required parameters
      // Format: /api/iiif-tile/{imageServiceId}/{tileSize}/{minLng}/{minLat}/{maxLng}/{maxLat}/{imageWidth}/{imageHeight}/{z}/{x}/{y}
      const minLng = bounds[0][0];
      const minLat = bounds[0][1];
      const maxLng = bounds[1][0];
      const maxLat = bounds[1][1];

      const tileUrlTemplate = `/api/iiif-tile/${encodeURIComponent(imageServiceId.value)}/${tileWidth}/${minLng}/${minLat}/${maxLng}/${maxLat}/${imageWidth}/${imageHeight}/{z}/{x}/{y}`;

      console.log('Using IIIF tiling with geo transformation:', {
        tileWidth,
        bounds: [minLng, minLat, maxLng, maxLat],
        imageDims: [imageWidth, imageHeight]
      });

      // Add raster source with tiled IIIF images
      map.addSource('iiif-image', {
        type: 'raster',
        tiles: [tileUrlTemplate],
        tileSize: tileWidth,
        bounds: [minLng, minLat, maxLng, maxLat],
        minzoom: 0,
        maxzoom: 22,
        scheme: 'xyz'
      } as any);

      console.log('Added IIIF tiled source');
    } else {
      // Fallback: use single image
      const availableSizes = imageInfo.value.sizes || [];
      let selectedSize = availableSizes.length > 0 ? availableSizes[availableSizes.length - 1] : null;

      if (availableSizes.length > 0) {
        for (let i = availableSizes.length - 1; i >= 0; i--) {
          const size = availableSizes[i];
          if (size.width <= 8000 && size.height <= 8000) {
            selectedSize = size;
            break;
          }
        }
      }

      const requestedWidth = selectedSize ? selectedSize.width : Math.min(4000, imageWidth);
      console.log('Using single image fallback, size:', requestedWidth);

      const originalImageUrl = `${imageServiceId.value}/full/${requestedWidth},/0/default.jpg`;
      const imageUrl = `/api/iiif-proxy?url=${encodeURIComponent(originalImageUrl)}`;

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      map.addSource('iiif-image', {
        type: 'image',
        url: blobUrl,
        coordinates: [
          [bounds[0][0], bounds[1][1]], // top-left [lng, lat]
          [bounds[1][0], bounds[1][1]], // top-right
          [bounds[1][0], bounds[0][1]], // bottom-right
          [bounds[0][0], bounds[0][1]]  // bottom-left
        ]
      } as any);
    }

    // Add raster layer
    map.addLayer({
      id: 'iiif-image-layer',
      type: 'raster',
      source: 'iiif-image',
      paint: {
        'raster-opacity': imageOpacity.value,
        'raster-fade-duration': 0
      }
    });
  } catch (error) {
    console.error('Failed to load IIIF image:', error);
    alert(t('imageLoadError'));
  }
};

// Update image opacity
watch(() => imageOpacity.value, (newOpacity) => {
  if (mapInstance.value && mapInstance.value.getLayer('iiif-image-layer')) {
    mapInstance.value.setPaintProperty('iiif-image-layer', 'raster-opacity', newOpacity);
  }
});

// Toggle image visibility
watch(() => imageVisible.value, (visible) => {
  if (mapInstance.value && mapInstance.value.getLayer('iiif-image-layer')) {
    mapInstance.value.setLayoutProperty(
      'iiif-image-layer',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
});

// Switch map style
const switchMapStyle = (index: number) => {
  if (!mapInstance.value || index === currentStyleIndex.value) {
    return;
  }

  currentStyleIndex.value = index;
  const style = mapStyles.value[index]?.style;

  if (!style) {
    return;
  }

  // Set new style
  mapInstance.value.setStyle(style as any);

  // Re-add image overlay after style is loaded
  mapInstance.value.once('idle', () => {
    addImageOverlay();
  });
};

// Initialize map
const initializeMap = () => {
  if (!mapContainer.value) return;

  const initialStyle = mapStyles.value[currentStyleIndex.value]?.style;

  if (!initialStyle) {
    console.error('Initial style not found');
    return;
  }

  mapInstance.value = new Map({
    container: mapContainer.value,
    style: initialStyle as any,
    center: center_.value as LngLatLike,
    zoom: zoom_.value,
  });

  // Add navigation control
  if (mdAndUp.value && mapInstance.value) {
    const navControl = new NavigationControl();
    (mapInstance.value as any).addControl(navControl, 'top-right');
  }

  // Map load event
  mapInstance.value.on('load', () => {
    mapReady.value = true;

    // Restore from URL parameters
    const query = route.query;

    if (query.mapZoom) {
      const zoomValue = parseFloat(query.mapZoom as string);
      if (!isNaN(zoomValue)) {
        zoom_.value = zoomValue;
        mapInstance.value!.setZoom(zoomValue);
      }
    }

    if (query.mapLat && query.mapLng) {
      const mapLat = parseFloat(query.mapLat as string);
      const mapLng = parseFloat(query.mapLng as string);
      if (!isNaN(mapLat) && !isNaN(mapLng)) {
        center_.value = [mapLng, mapLat];
        mapInstance.value!.setCenter([mapLng, mapLat] as LngLatLike);
      }
    } else if (imageBounds.value) {
      // Fit to image bounds
      mapInstance.value!.fitBounds(
        imageBounds.value as any,
        {
          padding: 50,
          duration: 1000
        }
      );
    }

    // Add image overlay
    if (imageServiceId.value && imageBounds.value && imageInfo.value) {
      addImageOverlay();
    }
  });
};

// Load manifest on mount
onMounted(async () => {
  const manifestUrl = route.query.u as string;

  if (manifestUrl) {
    await loadManifest(manifestUrl);
  }

  nextTick(() => {
    initializeMap();
  });
});

// Cleanup
onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.remove();
  }
});
</script>

<template>
  <div class="flex h-screen flex-col">
    <header
      class="flex flex-none items-center gap-2 bg-primary px-2 text-primary-foreground"
      style="height: 48px"
    >
      <span class="truncate font-medium">{{
        title || "IIIF Georeference Viewer"
      }}</span>

      <div class="flex-1"></div>

      <DsIconButton
        :icon="mdiViewSplitVertical"
        variant="ghost"
        :label="t('backToStandard')"
        class="!text-primary-foreground hover:!bg-primary-hover"
        @click="() => router.push(`/?${route.fullPath.split('?')[1] || ''}`)"
      />
    </header>

    <main class="relative min-h-0 flex-1">
      <div class="map-container">
        <div ref="mapContainer" class="map"></div>

        <!-- Layer selector button -->
        <div class="layer-selector">
          <DsMenu
            v-model="showLayerMenu"
            :close-on-content-click="false"
            placement="top"
          >
            <template #activator="{ props }">
              <DsIconButton
                v-bind="props"
                :icon="mdiLayers"
                variant="secondary"
                :label="t('レイヤー')"
                class="bg-surface shadow"
              />
            </template>

            <DsCard class="min-w-[200px] overflow-hidden p-1">
              <ul>
                <li v-for="(style, index) in mapStyles" :key="style.id">
                  <button
                    type="button"
                    class="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-muted"
                    :class="currentStyleIndex === index ? 'bg-surface-muted font-medium' : ''"
                    @click="() => { switchMapStyle(index); showLayerMenu = false; }"
                  >
                    {{ style.name }}
                  </button>
                </li>
              </ul>
            </DsCard>
          </DsMenu>
        </div>

        <!-- Image controls button -->
        <div class="image-controls-button">
          <DsIconButton
            :icon="mdiImage"
            variant="secondary"
            :label="t('imageSettings')"
            class="bg-surface shadow"
            @click="showImageControls = true"
          />
        </div>
      </div>
    </main>

    <!-- Image controls dialog -->
    <DsDialog v-model="showImageControls" maxWidth="400px">
      <template #default="{ close }">
        <div class="mb-4 flex items-center gap-2">
          <DsIcon :path="mdiImage" size="1.5rem" class="shrink-0 text-primary" />
          <h2 class="shrink-0 text-xl font-semibold text-foreground">
            {{ t("imageSettings") }}
          </h2>
          <span class="flex-1"></span>
          <DsIconButton
            :icon="mdiClose"
            variant="ghost"
            size="sm"
            :label="t('close')"
            @click="close"
          />
        </div>
        <div>
          <!-- Visibility toggle -->
          <DsSwitch v-model="imageVisible" class="mb-4">
            <span class="flex items-center gap-2">
              <DsIcon :path="imageVisible ? mdiEye : mdiEyeOff" size="1.25rem" />
              {{ imageVisible ? t("show") : t("hide") }}
            </span>
          </DsSwitch>

          <!-- Opacity slider -->
          <div class="mt-4">
            <label class="text-sm text-foreground-muted">{{ t("opacity") }}</label>
            <DsSlider
              v-model="imageOpacity"
              :min="0"
              :max="1"
              :step="0.05"
              :disabled="!imageVisible"
            >
              <template #prepend>
                <span class="inline-block w-[50px] text-right">
                  {{ (imageOpacity * 100).toFixed(0) }}%
                </span>
              </template>
            </DsSlider>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <DsButton variant="ghost" @click="close">{{ t("close") }}</DsButton>
        </div>
      </template>
    </DsDialog>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.layer-selector {
  position: absolute;
  bottom: 20px;
  left: 10px;
  z-index: 1000;
}

.image-controls-button {
  position: absolute;
  bottom: 70px;
  left: 10px;
  z-index: 1000;
}

:deep(.maplibregl-ctrl-icon) {
  background-color: var(--color-surface);
  border: none;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.maplibregl-ctrl-icon:hover) {
  background-color: var(--color-surface-muted);
}
</style>
