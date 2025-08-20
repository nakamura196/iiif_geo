<script setup lang="ts">
import { Map, NavigationControl, Marker, Popup, type LngLatLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useDisplay } from "vuetify";

interface PropType {
  zoom?: number;
  center?: any;
  height?: number;
  width?: number;
}

const { t } = useI18n();
const { mobile, mdAndUp } = useDisplay();

const props = withDefaults(defineProps<PropType>(), {
  zoom: 6,
  center: () => [128, 35], // [lng, lat] for MapLibre GL
  coordinates: () => [],
  popup: true,
  height: 0,
  width: 0,
});

// Map styles configuration
const mapStyles = ref([
  {
    id: "osm",
    name: "OpenStreetMap",
    style: {
      version: 8 as const,
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
    style: {
      version: 8 as const,
      sources: {
        rekichizu: {
          type: "raster" as const,
          tiles: ["https://b.oafree.net/tiles/rekichizu/tokyo5000/{z}/{x}/{y}.png"],
          tileSize: 256,
          minzoom: 5,
          maxzoom: 16,
          attribution: 'れきちず &copy; <a href="https://rekichizu.jp/">れきちず</a>'
        }
      },
      layers: [
        {
          id: "rekichizu",
          type: "raster" as const,
          source: "rekichizu"
        }
      ]
    },
    visible: false
  }
]);

const currentStyleIndex = ref(0);

// MapLibre GL instance
const mapInstance = ref<Map | null>(null);
const mapContainer = ref<HTMLDivElement>();
const mapReady = ref(false);

const zoom_ = ref(props.zoom);
const center_ = ref(props.center);

const { featuresMap, action, canvases, pageIndex } = useSettings();
const { settings } = usePanes();

const route = useRoute();
const router = useRouter();

let markers: Marker[] = [];
const currentLocationMarker = ref<Marker | null>(null);

// URL parameters update function
const updateMapURLParams = () => {
  let lat, lng;
  if (center_.value) {
    if (Array.isArray(center_.value) && center_.value.length >= 2) {
      lng = center_.value[0];
      lat = center_.value[1];
    }
  }
  
  if (lat === undefined || lng === undefined) {
    return;
  }
  
  const params = new URLSearchParams(window.location.search);
  params.set('mapZoom', zoom_.value.toString());
  params.set('mapLat', lat.toFixed(6));
  params.set('mapLng', lng.toFixed(6));
  
  const existingParams = ['u', 'annotations', 'zoom', 'centerX', 'centerY', 'rotation', 'id', 'lat', 'lng'];
  for (const param of existingParams) {
    if (route.query[param]) {
      params.set(param, route.query[param] as string);
    }
  }
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

// Debounced URL update
let mapUpdateTimeout: any = null;
const debouncedUpdateMapURLParams = () => {
  if (mapUpdateTimeout) {
    clearTimeout(mapUpdateTimeout);
  }
  mapUpdateTimeout = setTimeout(() => {
    updateMapURLParams();
  }, 500);
};

// Focus on current location
const focusCurrentLocation = () => {
  if (!mapInstance.value) return;
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLngLat: LngLatLike = [longitude, latitude];
        
        mapInstance.value!.flyTo({
          center: currentLngLat,
          zoom: 15
        });
        
        if (currentLocationMarker.value) {
          currentLocationMarker.value.remove();
        }
        
        currentLocationMarker.value = new Marker({ color: '#4080FF' })
          .setLngLat(currentLngLat)
          .setPopup(new Popup().setHTML(t('現在地')))
          .addTo(mapInstance.value!);
        
        currentLocationMarker.value.togglePopup();
        
        center_.value = [longitude, latitude];
        zoom_.value = 15;
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(t('位置情報の取得に失敗しました'));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    alert(t('お使いのブラウザは位置情報をサポートしていません'));
  }
};

// Switch map style
const switchMapStyle = (index: number) => {
  if (!mapInstance.value || index === currentStyleIndex.value) return;
  
  currentStyleIndex.value = index;
  const style = mapStyles.value[index].style;
  mapInstance.value.setStyle(style as any);
  
  // Re-add markers after style change
  mapInstance.value.once('styledata', () => {
    display();
  });
};

// Display markers
const display = () => {
  // Remove existing markers
  markers.forEach(marker => marker.remove());
  markers = [];

  let xs: number[] = [];
  let ys: number[] = [];

  const features =
    canvases.value[pageIndex.value]?.annotations?.[0]?.items?.[0]?.body?.features ||
    [];

  if (features.length === 0) {
    return;
  }

  for (const feature of features) {
    const coordinates = feature.geometry.coordinates;

    if (!coordinates[0] || !coordinates[1]) {
      continue;
    }

    const marker = new Marker()
      .setLngLat([coordinates[0], coordinates[1]] as LngLatLike);

    const metadata = feature.metadata || {};
    
    const popupContent = `
      <div>
        <div>ID: ${metadata.id || feature.id}</div>
        ${metadata.label ? `<div style="margin-top: 4px;">${t("name")}: ${metadata.label}</div>` : ""}
        ${metadata.tags ? `<div style="margin-top: 4px;">${t("tag")}: ${metadata.tags.join(",")}</div>` : ""}
        <div style="margin-top: 8px;">
          ${metadata.url ? `<a target="_blank" href="${metadata.url}">${t("detail")}</a>` : ""}
        </div>
      </div>
    `;
    
    marker.setPopup(new Popup().setHTML(popupContent));
    
    marker.getElement()?.addEventListener('click', () => {
      action.value = {
        type: "map",
        id: feature.id,
      };
    });

    if (mapInstance.value) {
      marker.addTo(mapInstance.value);
    }

    xs.push(coordinates[1]); // latitude
    ys.push(coordinates[0]); // longitude

    markers.push(marker);
  }

  // Calculate center if not specified in URL
  if (!route.query.mapLat && !route.query.mapLng) {
    const centerX = xs.reduce((acc, val) => acc + val, 0) / xs.length;
    const centerY = ys.reduce((acc, val) => acc + val, 0) / ys.length;
    center_.value = [centerY, centerX]; // [lng, lat]
  }
};

// Initialize map
const initializeMap = () => {
  if (!mapContainer.value) return;

  const initialStyle = mapStyles.value[currentStyleIndex.value].style;
  
  mapInstance.value = new Map({
    container: mapContainer.value,
    style: initialStyle as any,
    center: center_.value as LngLatLike,
    zoom: zoom_.value,
  });

  // Add navigation control
  if (mdAndUp.value) {
    mapInstance.value.addControl(new NavigationControl(), 'top-right');
  }

  // Add current location button
  const currentLocationBtn = document.createElement('button');
  currentLocationBtn.className = 'maplibregl-ctrl-icon';
  currentLocationBtn.innerHTML = '📍';
  currentLocationBtn.title = t('現在地を表示');
  currentLocationBtn.onclick = focusCurrentLocation;
  currentLocationBtn.style.fontSize = '18px';
  
  const currentLocationControl = document.createElement('div');
  currentLocationControl.className = 'maplibregl-ctrl maplibregl-ctrl-group';
  currentLocationControl.appendChild(currentLocationBtn);
  
  mapInstance.value.addControl({
    onAdd: () => currentLocationControl,
    onRemove: () => currentLocationControl
  } as any, 'top-right');

  // Map events
  mapInstance.value.on('moveend', () => {
    const center = mapInstance.value!.getCenter();
    center_.value = [center.lng, center.lat];
    debouncedUpdateMapURLParams();
  });

  mapInstance.value.on('zoomend', () => {
    zoom_.value = mapInstance.value!.getZoom();
    debouncedUpdateMapURLParams();
  });

  mapInstance.value.on('load', () => {
    mapReady.value = true;
    
    // Restore from URL parameters
    const query = route.query;
    
    if (query.zoom || query.mapZoom) {
      const zoomParam = query.zoom || query.mapZoom;
      const zoomValue = parseFloat(zoomParam as string);
      if (!isNaN(zoomValue)) {
        zoom_.value = zoomValue;
      }
    }
    
    let hasCoordinates = false;
    if (query.lat && query.lng) {
      const lat = parseFloat(query.lat as string);
      const lng = parseFloat(query.lng as string);
      if (!isNaN(lat) && !isNaN(lng)) {
        center_.value = [lng, lat];
        hasCoordinates = true;
        
        if (!query.zoom && !query.mapZoom) {
          zoom_.value = 15;
        }
        
        // Add marker for specified coordinates
        const focusMarker = new Marker({ color: '#FF4444' })
          .setLngLat([lng, lat])
          .setPopup(new Popup().setHTML(`${t('座標')}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`))
          .addTo(mapInstance.value!);
        focusMarker.togglePopup();
      }
    } else if (query.mapLat && query.mapLng) {
      const mapLat = parseFloat(query.mapLat as string);
      const mapLng = parseFloat(query.mapLng as string);
      if (!isNaN(mapLat) && !isNaN(mapLng)) {
        center_.value = [mapLng, mapLat];
        hasCoordinates = true;
      }
    }

    if (center_.value && zoom_.value) {
      mapInstance.value!.setCenter(center_.value as LngLatLike);
      mapInstance.value!.setZoom(zoom_.value);
    }

    // Display features
    if (canvases.value && canvases.value.length > 0) {
      display();
    }

    // Handle ID parameter
    if (query.id && !hasCoordinates) {
      const id = query.id as string;
      setTimeout(() => {
        if (Object.keys(featuresMap.value).length > 0 && featuresMap.value[id]) {
          const feature = featuresMap.value[id];
          if (feature.geometry?.coordinates) {
            if (!query.mapLat || !query.mapLng) {
              const lng = feature.geometry.coordinates[0];
              const lat = feature.geometry.coordinates[1];
              center_.value = [lng, lat];
            }
            if (!query.mapZoom && !query.mapLat && !query.mapLng) {
              zoom_.value = 15;
            }
            mapInstance.value!.setCenter(center_.value as LngLatLike);
            mapInstance.value!.setZoom(zoom_.value);
          }
        }
      }, 500);
    }

    updateMapURLParams();
  });
};

// Watch for page index changes
watch(
  () => pageIndex.value,
  () => {
    if (mapReady.value) {
      display();
    }
  }
);

// Watch for canvases changes
watch(
  () => canvases.value,
  () => {
    if (mapReady.value && canvases.value && canvases.value.length > 0) {
      display();
    }
  },
  { immediate: true }
);

// Watch for action changes
watch(
  () => action.value,
  (value) => {
    if (value && featuresMap.value[value.id]) {
      const feature = featuresMap.value[value.id];
      const coordinates = feature.geometry.coordinates;
      
      if (mapInstance.value) {
        mapInstance.value.flyTo({
          center: [coordinates[0], coordinates[1]] as LngLatLike,
          zoom: zoom_.value
        });
      }
      
      // Highlight selected marker
      markers.forEach((marker, index) => {
        // You can add custom styling for selected markers here
      });
    }
  }
);

// Initialize map on mount
onMounted(() => {
  nextTick(() => {
    initializeMap();
  });
});

// Cleanup
onUnmounted(() => {
  if (mapUpdateTimeout) {
    clearTimeout(mapUpdateTimeout);
  }
  if (mapInstance.value) {
    mapInstance.value.remove();
  }
});
</script>

<template>
  <div class="map-container">
    <div ref="mapContainer" class="map"></div>
    
    <!-- Map style switcher -->
    <div class="map-style-switcher">
      <v-btn-toggle
        v-model="currentStyleIndex"
        mandatory
        density="compact"
        rounded="xl"
      >
        <v-btn
          v-for="(style, index) in mapStyles"
          :key="style.id"
          :value="index"
          size="small"
          @click="switchMapStyle(index)"
        >
          {{ style.name }}
        </v-btn>
      </v-btn-toggle>
    </div>
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

.map-style-switcher {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

:deep(.maplibregl-ctrl-icon) {
  background-color: white;
  border: none;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.maplibregl-ctrl-icon:hover) {
  background-color: #f0f0f0;
}
</style>