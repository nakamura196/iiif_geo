<script setup lang="ts">
import { Map, NavigationControl, Marker, Popup, type LngLatLike, type MapSourceDataEvent } from "maplibre-gl";
import { mdiLayers, mdiMagnify, mdiMapMarker } from "@mdi/js";
import "maplibre-gl/dist/maplibre-gl.css";
import { useResponsive } from "~/composables/useResponsive";

interface PropType {
  zoom?: number;
  center?: any;
  height?: number;
  width?: number;
}

const { t } = useI18n();
const { mobile, mdAndUp } = useResponsive();

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
    // Use the official rekichizu style URL
    style: "https://mierune.github.io/rekichizu-style/styles/street/style.json",
    visible: false
  }
]);

const currentStyleIndex = ref(0);
const showLayerMenu = ref(false);
const searchQuery = ref('');
const geocodingResults = ref<any[]>([]);
const isSearching = ref(false);

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

// Use an object to store markers indexed by feature ID
const markersMap: { [key: string]: Marker } = {};
let markers: Marker[] = [];
const currentLocationMarker = ref<Marker | null>(null);
const selectedMarkerId = ref<string | null>(null);

// Store the GeoJSON data to persist across style switches
const geojsonData = ref<any>(null);

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
          .addTo(mapInstance.value as any);
        
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
  if (!mapInstance.value) {
    console.error('No map instance available');
    return;
  }
  
  if (index === currentStyleIndex.value) {
    return;
  }
  
  currentStyleIndex.value = index;
  const style = mapStyles.value[index]?.style;
  
  if (!style) {
    console.error('Style not found for index:', index);
    return;
  }
  
  // Store current location marker position before style switch
  let currentLocationData: { lngLat: LngLatLike, popup: string } | null = null;
  if (currentLocationMarker.value) {
    currentLocationData = {
      lngLat: currentLocationMarker.value.getLngLat(),
      popup: t('現在地')
    };
  }
  
  // Set new style
  mapInstance.value.setStyle(style as any);
  
  // Re-add everything after style is loaded  
  const restoreAfterStyleChange = () => {
    
    // Re-add current location marker if it existed
    if (currentLocationData) {
      currentLocationMarker.value = new Marker({ color: '#4080FF' })
        .setLngLat(currentLocationData.lngLat)
        .setPopup(new Popup().setHTML(currentLocationData.popup))
        .addTo(mapInstance.value as any);
    }
    
    // Re-add clustering with stored data
    if (geojsonData.value) {
      setupClusteringWithData(geojsonData.value);
    }
  };
  
  // Use idle event which fires after style is fully loaded
  mapInstance.value.once('idle', restoreAfterStyleChange);
};

// Setup clustering with data
const setupClusteringWithData = (geojson: any) => {
  if (!mapInstance.value || !geojson) {
    console.error('No map instance or data in setupClusteringWithData');
    return;
  }
  
  // Remove existing source and layers if they exist (for clean re-creation)
  const layersToRemove = ['cluster-count', 'unclustered-point', 'clusters'];
  for (const layer of layersToRemove) {
    try {
      if (mapInstance.value.getLayer(layer)) {
        mapInstance.value.removeLayer(layer);
      }
    } catch (e) {
    }
  }
  
  try {
    if (mapInstance.value.getSource('points')) {
      mapInstance.value.removeSource('points');
    }
  } catch (e) {
  }
  
  // Add source for points
  try {
    mapInstance.value.addSource('points', {
      type: 'geojson',
      data: geojson as any,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
  } catch (e) {
    console.error('Failed to add source:', e);
    return;
  }
  
  // Always add layers (they were removed above)
  // Add cluster layer
  try {
    mapInstance.value.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'points',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          10,
          '#f1f075',
          30,
          '#f28cb1'
        ],
        'circle-radius': 20
      }
    });
  } catch (e) {
    console.error('Failed to add cluster layer:', e);
    return;
  }
  
  // Add cluster count layer
  try {
    mapInstance.value.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'points',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 14
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });
  } catch (e) {
    console.warn('Could not add cluster count layer:', e);
  }
  
  // Add unclustered point layer
  try {
    mapInstance.value.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'points',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'id'], selectedMarkerId.value || ''],
          '#FF0000',
          '#3FB1CE'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
  } catch (e) {
    console.error('Failed to add unclustered point layer:', e);
    // Don't return here, continue with event listeners
  }
  
  // Setup event listeners - always set them up after adding layers
  
  // Remove existing listeners first (if any)
  try {
    mapInstance.value.off('click', 'clusters' as any);
    mapInstance.value.off('click', 'unclustered-point' as any);
    mapInstance.value.off('mouseenter' as any, 'clusters' as any);
    mapInstance.value.off('mouseleave' as any, 'clusters' as any);
    mapInstance.value.off('mouseenter' as any, 'unclustered-point' as any);
    mapInstance.value.off('mouseleave' as any, 'unclustered-point' as any);
  } catch (e) {
    // Ignore errors - listeners might not exist
  }
  
  // Add click handler for clusters
  mapInstance.value.on('click', 'clusters', (e) => {
    const features = mapInstance.value!.queryRenderedFeatures(e.point, {
      layers: ['clusters']
    });
    
    if (features.length === 0) {
      return;
    }
    
    const feature = features[0];
    if (!feature || !feature.properties) {
      console.error('Feature or properties not found');
      return;
    }
    
    const clusterId = feature.properties.cluster_id;
    
    // Direct approach without callback
    const source = mapInstance.value!.getSource('points') as any;
    if (!source) {
      console.error('Source not found');
      return;
    }
    
    // Try different approach - just zoom in to the cluster location
    const coordinates = (feature.geometry as any)?.coordinates;
    if (!coordinates) {
      console.error('No coordinates found for cluster');
      return;
    }
    const currentZoom = mapInstance.value!.getZoom();
    
    
    // Zoom in by 2 levels or to maxZoom
    mapInstance.value!.easeTo({
      center: coordinates,
      zoom: Math.min(currentZoom + 2, 18),
      duration: 500
    });
  });
  
  // Handle click on unclustered points
  mapInstance.value.on('click', 'unclustered-point', (e) => {
    e.preventDefault();
    
    if (!e.features || e.features.length === 0) {
      console.error('No features in click event');
      return;
    }
    
    const feature = e.features[0];
    if (!feature || !feature.properties) {
      console.error('Feature or properties not found');
      return;
    }
    
    const id = feature.properties.id;
    
    if (!id) {
      console.error('No ID found for feature');
      return;
    }
    
    selectedMarkerId.value = id;
    action.value = {
      type: "map",
      id: id
    };
    
    // Update paint property to highlight selected point
    try {
      mapInstance.value!.setPaintProperty('unclustered-point', 'circle-color', [
        'case',
        ['==', ['get', 'id'], selectedMarkerId.value],
        '#FF0000',
        '#3FB1CE'
      ]);
    } catch (e) {
      console.error('Failed to update paint property:', e);
    }
    
    // Show popup
    const coordinates = (feature.geometry as any)?.coordinates?.slice();
    if (!coordinates) {
      console.error('No coordinates found for feature');
      return;
    }
    
    const properties = feature.properties;

    // リンクタイプの翻訳
    const translateLinkType = (type: string) => {
      const key = `linkType.${type}`;
      const translated = t(key);
      return translated === key ? type : translated;
    };

    // linksの表示を生成 (LPF形式) またはレガシーurl
    // MapLibreのGeoJSONソースでは配列がJSON文字列化されるためパースが必要
    let linksHtml = '';
    let parsedLinks: any[] = [];
    if (properties.links) {
      try {
        parsedLinks = typeof properties.links === 'string'
          ? JSON.parse(properties.links)
          : properties.links;
      } catch (e) {
        parsedLinks = [];
      }
    }
    if (parsedLinks.length > 0) {
      linksHtml = parsedLinks.map((link: any) =>
        `<a target="_blank" href="${link.identifier}">${translateLinkType(link.type)}</a>`
      ).join(' | ');
    } else if (properties.url) {
      linksHtml = `<a target="_blank" href="${properties.url}">${t("detail")}</a>`;
    }

    // depictionsの表示を生成（サムネイル画像として表示）
    let depictionsHtml = '';
    let parsedDepictions: any[] = [];
    if (properties.depictions) {
      try {
        parsedDepictions = typeof properties.depictions === 'string'
          ? JSON.parse(properties.depictions)
          : properties.depictions;
      } catch (e) {
        parsedDepictions = [];
      }
    }
    if (parsedDepictions.length > 0) {
      depictionsHtml = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">` +
        parsedDepictions.map((dep: any) =>
          `<a target="_blank" href="${dep["@id"]}" title="${dep.title || ''}">
            <img src="${dep["@id"]}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />
          </a>`
        ).join('') + `</div>`;
    }

    const description = `
      <div>
        <div>ID: ${properties.id || ''}</div>
        ${properties.label ? `<div style="margin-top: 4px;">${t("name")}: ${properties.label}</div>` : ""}
        ${properties.tags && Array.isArray(properties.tags) && properties.tags.length ? `<div style="margin-top: 4px;">${t("tag")}: ${properties.tags.join(",")}</div>` : ""}
        ${linksHtml ? `<div style="margin-top: 8px;">${linksHtml}</div>` : ""}
        ${depictionsHtml ? `<div style="margin-top: 4px;">${depictionsHtml}</div>` : ""}
      </div>
    `;
    
    
    try {
      new Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(mapInstance.value as any);
    } catch (e) {
      console.error('Failed to add popup:', e);
    }
  });
    
    // Change cursor on hover
    mapInstance.value.on('mouseenter', 'clusters', () => {
      mapInstance.value!.getCanvas().style.cursor = 'pointer';
    });
    mapInstance.value.on('mouseleave', 'clusters', () => {
      mapInstance.value!.getCanvas().style.cursor = '';
    });
    mapInstance.value.on('mouseenter', 'unclustered-point', () => {
      mapInstance.value!.getCanvas().style.cursor = 'pointer';
    });
    mapInstance.value.on('mouseleave', 'unclustered-point', () => {
      mapInstance.value!.getCanvas().style.cursor = '';
    });
  
};

// Setup clustering (wrapper that prepares data)
const setupClustering = () => {
  if (!mapInstance.value) {
    console.error('No map instance in setupClustering');
    return;
  }
  
  const features =
    canvases.value[pageIndex.value]?.annotations?.[0]?.items?.[0]?.body?.features ||
    [];
  
  if (features.length === 0) {
    console.warn('No features to display');
    return;
  }
  
  // Convert features to GeoJSON format for clustering
  // 新フォーマット (LPF/properties) と旧フォーマット (metadata) の両方をサポート
  const geojsonFeatures = features.map((feature: any) => {
    const metadata = feature.metadata || {};
    const props = feature.properties || {};

    // ID: id (GeoJSON標準) > @id (LPF) > metadata.id (レガシー)
    const displayId = feature.id || feature["@id"] || metadata.id;
    // title: properties.title (推奨) > metadata.label (レガシー)
    const displayTitle = props.title || metadata.label || '';
    // tags: properties.tags (推奨) > metadata.tags (レガシー)
    const displayTags = props.tags || metadata.tags || [];
    // links: feature.links (LPF)
    const displayLinks = feature.links || [];
    // depictions: feature.depictions (LPF)
    const displayDepictions = feature.depictions || [];
    // url: metadata.url (レガシー)
    const legacyUrl = metadata.url || '';

    return {
      type: 'Feature',
      properties: {
        id: displayId,
        label: displayTitle,
        tags: displayTags,
        // MapLibreのGeoJSONソースでは配列/オブジェクトはJSON文字列化される
        links: displayLinks.length > 0 ? JSON.stringify(displayLinks) : '',
        depictions: displayDepictions.length > 0 ? JSON.stringify(displayDepictions) : '',
        url: legacyUrl
      },
      geometry: {
        type: 'Point',
        coordinates: [feature.geometry?.coordinates?.[0] || 0, feature.geometry?.coordinates?.[1] || 0]
      }
    };
  });
  
  const geojson = {
    type: 'FeatureCollection',
    features: geojsonFeatures
  };
  
  // Store the data for persistence across style switches
  geojsonData.value = geojson;
  
  // Setup clustering with the data
  setupClusteringWithData(geojson);
  
};

// Display markers (simplified for clustering)
const display = () => {
  setupClustering();
  
  // Calculate bounds to fit all markers if not specified in URL
  const features =
    canvases.value[pageIndex.value]?.annotations?.[0]?.items?.[0]?.body?.features ||
    [];
  
  if (features.length > 0 && !route.query.mapLat && !route.query.mapLng && !route.query.mapZoom) {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    
    for (const feature of features) {
      const coordinates = feature.geometry?.coordinates;
      if (coordinates?.[0] && coordinates?.[1]) {
        const lng = coordinates[0];
        const lat = coordinates[1];
        
        // Validate coordinates are within valid ranges
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        } else {
          console.warn(`Invalid coordinates found - lng: ${lng}, lat: ${lat}. Skipping this feature.`);
        }
      }
    }
    
    if (minLng !== Infinity && maxLng !== -Infinity && 
        minLat !== Infinity && maxLat !== -Infinity) {
      // Additional validation before fitting bounds
      if (minLat >= -90 && maxLat <= 90 && minLng >= -180 && maxLng <= 180) {
        // Fit map to bounds with padding
        mapInstance.value?.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 15, // Prevent zooming in too much if markers are very close
            duration: 1000
          }
        );
      } else {
        console.error(`Invalid bounds detected - minLng: ${minLng}, minLat: ${minLat}, maxLng: ${maxLng}, maxLat: ${maxLat}`);
      }
    }
  }
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
  // @ts-expect-error - MapLibre GL type instantiation issue 
  if (mdAndUp.value && mapInstance.value) {
    const navControl = new NavigationControl();
    (mapInstance.value as any).addControl(navControl, 'top-right');
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
          .addTo(mapInstance.value as any);
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

    // Only set center/zoom if we have URL parameters
    if (hasCoordinates || query.mapZoom || query.zoom) {
      if (center_.value && zoom_.value) {
        mapInstance.value!.setCenter(center_.value as LngLatLike);
        mapInstance.value!.setZoom(zoom_.value);
      }
    }

    // Display features (will auto-fit if no URL params)
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
              if (lng !== undefined && lat !== undefined) {
                center_.value = [lng, lat];
              }
            }
            if (!query.mapZoom && !query.mapLat && !query.mapLng) {
              zoom_.value = 15;
            }
            if (center_.value && mapInstance.value) {
              mapInstance.value.setCenter(center_.value as LngLatLike);
              mapInstance.value.setZoom(zoom_.value);
            }
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
    if (value && value.id && featuresMap.value[value.id]) {
      const feature = featuresMap.value[value.id];
      
      if (!feature || !feature.geometry?.coordinates) {
        console.error('Feature or geometry not found for id:', value.id);
        return;
      }
      
      const coordinates = feature.geometry.coordinates;
      
      if (!coordinates || coordinates.length < 2) {
        console.error('Invalid coordinates for feature:', value.id);
        return;
      }
      
      // Update selected marker ID
      selectedMarkerId.value = value.id;
      
      if (mapInstance.value) {
        const lng = coordinates[0];
        const lat = coordinates[1];
        
        if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
          console.error('Invalid coordinate values:', lng, lat);
          return;
        }
        
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          mapInstance.value.flyTo({
            center: [lng, lat]
          });

          // Update paint property to highlight selected point
          if (mapInstance.value.getLayer('unclustered-point')) {
            mapInstance.value.setPaintProperty('unclustered-point', 'circle-color', [
              'case',
              ['==', ['get', 'id'], selectedMarkerId.value],
              '#FF0000',
              '#3FB1CE'
            ]);
          }
        }
      }
    }
  }
);

// Initialize map on mount
onMounted(() => {
  nextTick(() => {
    initializeMap();
  });
});

// Nominatim geocoding search
let geocodingTimeout: any = null;
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    geocodingResults.value = [];
    isSearching.value = false;
    return;
  }

  // Clear previous timeout
  if (geocodingTimeout) {
    clearTimeout(geocodingTimeout);
  }

  isSearching.value = true;

  // Debounce geocoding search (500ms)
  geocodingTimeout = setTimeout(async () => {
    try {
      // Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery.value)}&limit=10&accept-language=ja`,
        {
          headers: {
            'User-Agent': 'IIIF-Geo-Viewer/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      geocodingResults.value = data;
    } catch (error) {
      console.error('Geocoding error:', error);
      geocodingResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }, 500);
};

// Handle geocoding result click
const selectGeocodingResult = (result: any) => {
  if (!mapInstance.value) {
    return;
  }

  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);

  // Fly to the location
  mapInstance.value.flyTo({
    center: [lng, lat],
    zoom: 15,
    duration: 1000
  });

  // Add a temporary marker for the geocoded location
  new Marker({ color: '#FF4444' })
    .setLngLat([lng, lat])
    .setPopup(new Popup().setHTML(`
      <div>
        <strong>${result.display_name}</strong>
        ${result.type ? `<div style="margin-top: 4px; font-size: 0.9em; color: #666;">${result.type}</div>` : ''}
      </div>
    `))
    .addTo(mapInstance.value as any)
    .togglePopup();
};

// Watch search query
watch(() => searchQuery.value, () => {
  performSearch();
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

    <!-- Search form (top-left) -->
    <div class="search-container">
      <DsCard class="overflow-hidden">
        <div class="flex items-center gap-2 px-3 py-2">
          <DsIcon :path="mdiMagnify" size="1.25rem" class="text-foreground-muted" />
          <input
            v-model="searchQuery"
            :placeholder="t('placeSearch')"
            class="ds-input focus:ds-input-focus border-0 shadow-none flex-1"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="text-foreground-muted"
            @click="searchQuery = ''; geocodingResults = []"
          >✕</button>
        </div>

        <!-- Search results below form -->
        <div v-if="searchQuery.trim()" class="search-results-container">
          <div v-if="isSearching" class="h-0.5 w-full overflow-hidden bg-surface-muted">
            <div class="h-full w-1/3 animate-pulse bg-primary"></div>
          </div>

          <ul v-if="geocodingResults.length > 0" class="search-results-list">
            <li v-for="(result, index) in geocodingResults" :key="`geo-${index}`">
              <button
                type="button"
                class="search-result-item flex w-full items-start gap-2 px-3 py-2 text-left"
                @click="selectGeocodingResult(result)"
              >
                <DsIcon :path="mdiMapMarker" size="1.25rem" class="mt-0.5 flex-none text-primary" />
                <span class="min-w-0">
                  <span class="block break-words">{{ result.display_name }}</span>
                  <span v-if="result.type" class="block text-sm text-foreground-muted">{{ result.type }}</span>
                </span>
              </button>
            </li>
          </ul>

          <!-- No results -->
          <div v-if="!isSearching && geocodingResults.length === 0" class="p-3 text-center text-foreground-muted">
            {{ t('結果が見つかりません') }}
          </div>
        </div>
      </DsCard>
    </div>

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
                @click="switchMapStyle(index); showLayerMenu = false"
              >{{ style.name }}</button>
            </li>
          </ul>
        </DsCard>
      </DsMenu>
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

.search-container {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  min-width: 320px;
  max-width: 450px;
}

.search-results-container {
  background-color: white;
}

.search-results-list {
  max-height: 400px;
  overflow-y: auto;
  background-color: white;
}

.search-result-item {
  cursor: pointer;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.layer-selector {
  position: absolute;
  bottom: 20px;
  left: 10px;
  z-index: 1000;
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