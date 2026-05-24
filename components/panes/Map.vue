<script setup lang="ts">
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster.js";
import { Map } from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// @ts-ignore
import { MarkerClusterGroup } from "leaflet.markercluster";
import { LMap, LTileLayer, LControlLayers } from "@vue-leaflet/vue-leaflet";
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
  center: () => [54, 28],

  coordinates: () => [],
  popup: true,
  height: 0,
  width: 0,
});

const tileProviders = [
  {
    name: "OpenStreetMap",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    visible: true,
  },
  {
    name: t("国土地理院ウェブサイト"),
    attribution: t("国土地理院ウェブサイト"),
    url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    visible: false,
  },
  {
    name: t("空中写真"),
    attribution: t("国土地理院ウェブサイト"),
    url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    visible: false,
  },
];

// Leaflet マップの準備ができたかどうかを追跡
const leafletReady = ref(false);

// MarkerCluster グループのインスタンス
let markerCluster: MarkerClusterGroup | null = null;

const zoom_ = ref(props.zoom);
const center_ = ref(props.center);

const { featuresMap, action, canvases, pageIndex } = useSettings();
const { settings } = usePanes();

const route = useRoute();
const router = useRouter();

let markers: any[] = [];

const map = ref<Map | null>(null);
const currentLocationMarker = ref<L.Marker | null>(null);

// URLパラメータを更新する関数
const updateMapURLParams = () => {
  
  // center_が正しく初期化されていない場合は処理をスキップ
  let lat, lng;
  if (center_.value) {
    // LatLngオブジェクトの場合
    if (center_.value.lat !== undefined && center_.value.lng !== undefined) {
      lat = center_.value.lat;
      lng = center_.value.lng;
    } 
    // 配列の場合
    else if (Array.isArray(center_.value) && center_.value.length >= 2) {
      lat = center_.value[0];
      lng = center_.value[1];
    }
  }
  
  if (lat === undefined || lng === undefined) {
    return;
  }
  
  const params = new URLSearchParams(window.location.search);
  
  // 地図のズームレベル
  params.set('mapZoom', zoom_.value.toString());
  
  // 地図の中央座標
  params.set('mapLat', lat.toFixed(6));
  params.set('mapLng', lng.toFixed(6));
  
  
  // 既存のパラメータを保持
  const existingParams = ['u', 'annotations', 'zoom', 'centerX', 'centerY', 'rotation', 'id', 'lat', 'lng'];
  for (const param of existingParams) {
    if (route.query[param]) {
      params.set(param, route.query[param] as string);
    }
  }
  
  // URLを更新（History APIを使用してリロードを防ぐ）
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

// デバウンス付きのURL更新
let mapUpdateTimeout: any = null;
const debouncedUpdateMapURLParams = () => {
  if (mapUpdateTimeout) {
    clearTimeout(mapUpdateTimeout);
  }
  mapUpdateTimeout = setTimeout(() => {
    updateMapURLParams();
  }, 500);
};

// 現在地にフォーカスする関数
const focusCurrentLocation = () => {
  if (!map.value) return;
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLatLng = [latitude, longitude] as [number, number];
        
        // 現在地にマップを移動
        map.value!.setView(currentLatLng, 15);
        
        // 既存の現在地マーカーがあれば削除
        if (currentLocationMarker.value) {
          currentLocationMarker.value.remove();
        }
        
        // 現在地マーカーを作成（useMapColors.currentLocation）
        currentLocationMarker.value = L.marker(currentLatLng, {
          icon: L.divIcon({
            className: "current-location-marker",
            html: `<span style="display:block;width:24px;height:24px;border-radius:50%;box-sizing:border-box;background:${mapColors.currentLocation}33;border:2px solid ${mapColors.currentLocation};position:relative;"><span style="position:absolute;inset:7px;border-radius:50%;background:${mapColors.currentLocation};"></span></span>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        });
        
        currentLocationMarker.value.addTo(map.value as L.Map);
        currentLocationMarker.value.bindPopup(t('現在地')).openPopup();
        
        // URL パラメータも更新
        center_.value = currentLatLng;
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

// Leaflet マップの準備ができた際の処理
const onLeafletReady = (mapInstance: L.Map) => {
  leafletReady.value = true;
  map.value = mapInstance;
  initializeMarkerCluster(mapInstance);
  
  // 現在地ボタンを追加
  const LocationControl = L.Control.extend({
    options: {
      position: 'topright'
    },
    onAdd: function() {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const button = L.DomUtil.create('a', '', container);
      button.innerHTML = '📍';
      button.href = '#';
      button.title = t('現在地を表示');
      button.style.fontSize = '18px';
      button.style.width = '30px';
      button.style.height = '30px';
      button.style.lineHeight = '30px';
      button.style.textAlign = 'center';
      button.style.textDecoration = 'none';
      button.style.display = 'block';
      button.style.backgroundColor = 'white';
      button.style.cursor = 'pointer';
      
      L.DomEvent.on(button, 'click', function(e: Event) {
        L.DomEvent.preventDefault(e);
        focusCurrentLocation();
      });
      
      return container;
    }
  });
  
  new LocationControl().addTo(mapInstance);
  
  // URLパラメータから初期状態を復元
  const query = route.query;
  
  // ズームレベルの設定（zoom または mapZoom パラメータ）
  if (query.zoom || query.mapZoom) {
    const zoomParam = query.zoom || query.mapZoom;
    const zoomValue = parseInt(zoomParam as string);
    if (!isNaN(zoomValue)) {
      zoom_.value = zoomValue;
    }
  }
  
  // 座標の設定（lat/lng または mapLat/mapLng パラメータ）
  // 優先順位: lat/lng > mapLat/mapLng
  let hasCoordinates = false;
  if (query.lat && query.lng) {
    const lat = parseFloat(query.lat as string);
    const lng = parseFloat(query.lng as string);
    if (!isNaN(lat) && !isNaN(lng)) {
      center_.value = [lat, lng];
      hasCoordinates = true;
      
      // lat/lngが指定された場合、適切なズームレベルを設定（他のズームパラメータがない場合）
      if (!query.zoom && !query.mapZoom) {
        zoom_.value = 15;
      }
      
      // 指定座標にマーカーを配置
      setTimeout(() => {
        if (map.value) {
          const focusMarker = L.marker([lat, lng], {
            icon: L.icon({
              // Teardrop pin tinted from useMapColors.focus.
              iconUrl: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' fill='${encodeURIComponent(mapColors.focus)}'/></svg>`,
              iconSize: [30, 30],
              iconAnchor: [15, 30],
              popupAnchor: [0, -30]
            })
          });
          focusMarker.addTo(map.value as L.Map);
          focusMarker.bindPopup(`${t('座標')}: ${lat.toFixed(6)}, ${lng.toFixed(6)}`).openPopup();
        }
      }, 500);
    }
  } else if (query.mapLat && query.mapLng) {
    const mapLat = parseFloat(query.mapLat as string);
    const mapLng = parseFloat(query.mapLng as string);
    if (!isNaN(mapLat) && !isNaN(mapLng)) {
      center_.value = [mapLat, mapLng];
      hasCoordinates = true;
    }
  }
  
  // canvasesデータが読み込まれているか確認してdisplayを実行
  if (canvases.value && canvases.value.length > 0) {
    display();
  } else {
    // データがまだない場合は、watchで後から実行される
  }
  
  // 地図の移動・ズームイベントを監視
  mapInstance.on('moveend', () => {
    debouncedUpdateMapURLParams();
  });
  mapInstance.on('zoomend', () => {
    debouncedUpdateMapURLParams();
  });
  
  // URLにIDが指定されている場合、その位置を中心に表示（座標パラメータがない場合のみ）
  if (query.id && !hasCoordinates) {
    const id = query.id as string;
    // featuresMapが準備できるまで監視（デプロイ環境対応）
    let attempts = 0;
    const maxAttempts = 100; // 10秒間待機
    const checkFeature = () => {
      attempts++;
      
      if (Object.keys(featuresMap.value).length > 0 && featuresMap.value[id]) {
        const feature = featuresMap.value[id];
        if (feature.geometry?.coordinates && feature.geometry.coordinates.length >= 2) {
          // URLパラメータで座標が指定されていない場合のみ、IDの位置に移動
          if (!query.mapLat || !query.mapLng) {
            // GeoJSONの座標は[longitude, latitude]の順序
            const lng = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];
            if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
              center_.value = [lat, lng]; // Leafletは[latitude, longitude]の順序
            }
          }
          // ズームレベルも適切に設定（IDが指定されている場合は既存のズームレベルを維持）
          if (!query.mapZoom && !query.mapLat && !query.mapLng) {
            zoom_.value = 15; // デフォルトで詳細表示
          }
        }
      } else if (attempts < maxAttempts) {
        // まだ準備できていない場合は再試行
        setTimeout(checkFeature, 100);
      } else {
      }
    };
    // 初回実行を少し遅延（デプロイ環境ではさらに遅延）
    setTimeout(checkFeature, 500);
  }
  
  // 初期化完了後、URL更新を一度実行
  setTimeout(() => {
    updateMapURLParams();
  }, 300);
};

// MarkerCluster グループの初期化
const initializeMarkerCluster = (map: L.Map) => {
  if (!markerCluster) {
    // @ts-ignore
    markerCluster = L.markerClusterGroup({
      removeOutsideVisibleBounds: true,
      chunkedLoading: true,
      iconCreateFunction: clusterIcon,
    });
    map.addLayer(markerCluster);
  }
};

// Brand marker / cluster icons (shared palette — see composables/useMapColors).
// Circle markers + teal cluster ramp mirror the MapLibre GL view so both map
// modes look identical and on-brand.
const circleIcon = (color: string) =>
  L.divIcon({
    className: "annotation-marker",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:1px solid ${mapColors.markerStroke};box-shadow:0 0 2px rgba(0,0,0,0.4);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });

const clusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const bg =
    count >= 30
      ? mapColors.clusterLarge
      : count >= 10
        ? mapColors.clusterMedium
        : mapColors.clusterSmall;
  return L.divIcon({
    className: "annotation-cluster",
    html: `<div style="width:40px;height:40px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:${mapColors.clusterText};font-weight:bold;font-size:14px;box-shadow:0 0 5px rgba(0,0,0,0.5);text-shadow:-1px -1px 0 rgba(0,0,0,.35),1px -1px 0 rgba(0,0,0,.35),-1px 1px 0 rgba(0,0,0,.35),1px 1px 0 rgba(0,0,0,.35);">${count}</div>`,
    iconSize: [40, 40],
  });
};

const display = () => {

  // 現在のマーカーをすべて削除
  if (markerCluster) {
    markerCluster.clearLayers();
  }

  let xs: number[] = [];
  let ys: number[] = [];

  const features =
    canvases.value[pageIndex.value]?.annotations?.[0]?.items?.[0]?.body?.features ||
    [];

  if (features.length === 0) {
    return;
  }

  markers = [];

  for (const feature of features) {
    if (!feature.geometry || !feature.geometry.coordinates) {
      console.warn('Feature missing geometry:', feature.id);
      continue;
    }
    
    const coordinates = feature.geometry.coordinates;

    if (!coordinates[0] || !coordinates[1]) {
      continue;
    }

    const marker = L.marker([coordinates[1], coordinates[0]], {
      icon: circleIcon(mapColors.marker),
    });

    // @ts-ignore
    marker.id = feature.id;

    marker.on("click", () => {
      const id = feature.id;

      action.value = {
        type: "map",
        id,
      };
    });

    xs.push(coordinates[1]); // 緯度
    ys.push(coordinates[0]); // 経度

    const popup = L.popup();
    marker.bindPopup(popup);

    // 新フォーマット (LPF/properties) と旧フォーマット (metadata) の両方をサポート
    const metadata = feature.metadata || {};
    const props = feature.properties || {};

    // ID: id (GeoJSON標準) > @id (LPF) > metadata.id (レガシー)
    const displayId = feature.id || feature["@id"] || metadata.id;
    // title: properties.title (推奨) > metadata.label (レガシー)
    const displayTitle = props.title || metadata.label;
    // tags: properties.tags (推奨) > metadata.tags (レガシー)
    const displayTags = props.tags || metadata.tags;
    // links: feature.links (LPF) > metadata.url (レガシー)
    const displayLinks = feature.links || [];
    const legacyUrl = metadata.url;
    // depictions: feature.depictions (LPF)
    const displayDepictions = feature.depictions || [];

    // リンクタイプの翻訳
    const translateLinkType = (type: string) => {
      const key = `linkType.${type}`;
      const translated = t(key);
      // 翻訳キーがそのまま返ってきた場合は元のタイプ名を使用
      return translated === key ? type : translated;
    };

    // linksの表示を生成
    let linksHtml = '';
    if (displayLinks.length > 0) {
      linksHtml = displayLinks.map((link: any) =>
        `<a target="_blank" rel="noopener noreferrer" href="${link.identifier}">${translateLinkType(link.type)}</a>`
      ).join(' | ');
    } else if (legacyUrl) {
      linksHtml = `<a target="_blank" rel="noopener noreferrer" href="${legacyUrl}">${t("detail")}</a>`;
    }

    // depictionsの表示を生成（サムネイル画像として表示）
    let depictionsHtml = '';
    if (displayDepictions.length > 0) {
      depictionsHtml = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">` +
        displayDepictions.map((dep: any) =>
          `<a target="_blank" rel="noopener noreferrer" href="${dep["@id"]}" title="${dep.title || ''}">
            <img src="${dep["@id"]}" alt="${dep.title || ''}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />
          </a>`
        ).join('') + `</div>`;
    }

    popup.setContent(
      `<div>
            <div>ID: ${displayId}</div>
            ${displayTitle ? `<div style="margin-top: 4px;">${t("name")}: ${displayTitle}</div>` : ""}
            ${displayTags ? `<div style="margin-top: 4px;">${t("tag")}: ${displayTags.join(",")}</div>` : ""}
            ${linksHtml ? `<div style="margin-top: 8px;">${linksHtml}</div>` : ""}
            ${depictionsHtml ? `<div style="margin-top: 4px;">${depictionsHtml}</div>` : ""}
        </div>`
    );

    markers.push(marker);
  }

  // 中心座標の計算（URLパラメータがない場合のみ）
  if (!route.query.mapLat && !route.query.mapLng) {
    const centerX = xs.reduce((acc, val) => acc + val, 0) / xs.length; // 緯度の平均
    const centerY = ys.reduce((acc, val) => acc + val, 0) / ys.length; // 経度の平均

    // 中心座標をセット
    center_.value = [centerX, centerY];
  }

  markerCluster.addLayers(markers);
  
  // 強制的に再描画
  if (map.value) {
    setTimeout(() => {
      if (map.value) {
        map.value.invalidateSize();
      }
      if (markerCluster) {
        markerCluster.refreshClusters();
      }
    }, 100);
  }
};

const updateMapSize = () => {
  nextTick(() => {
    map.value?.invalidateSize();
  });
};

// pageIndexが変更された際にdisplay()を呼び出す
watch(
  () => pageIndex.value,
  () => {
    if (leafletReady.value) {
      display();
    }
  }
);

// canvasesが変更された際にもdisplay()を呼び出す（初回読み込み対応）
watch(
  () => canvases.value,
  () => {
    if (leafletReady.value && canvases.value && canvases.value.length > 0) {
      display();
    }
  },
  { immediate: true }
);

// zoom_とcenter_の変更を監視してURL更新
watch(() => zoom_.value, () => {
  if (leafletReady.value && map.value) {
    debouncedUpdateMapURLParams();
  }
});

watch(() => center_.value, () => {
  if (leafletReady.value && map.value) {
    debouncedUpdateMapURLParams();
  }
}, { deep: true });

watch(
  () => action.value,
  (value) => {
    // value.type === "osd" || value.type === "both"
    if (true) {
      const feature = featuresMap.value[value.id];

      if (!feature || !feature.geometry || !feature.geometry.coordinates) {
        console.warn('Feature not found or missing geometry for id:', value.id);
        return;
      }

      const coordinates = feature.geometry.coordinates;

      center_.value = [coordinates[1], coordinates[0]];

      for (const marker of markers) {
        marker.setIcon(
          circleIcon(
            marker.id === value.id ? mapColors.markerSelected : mapColors.marker
          )
        );
      }

      /*
       */
    }
  }
);

watch(
  () => [props.width, props.height, settings.value.panes.length],
  () => {
    updateMapSize();
  }
);

// クリーンアップ
onUnmounted(() => {
  if (mapUpdateTimeout) {
    clearTimeout(mapUpdateTimeout);
  }
  if (map.value) {
    map.value.off('moveend', debouncedUpdateMapURLParams);
    map.value.off('zoomend', debouncedUpdateMapURLParams);
  }
});
</script>

<template>
  <div style="width: 100%; height: 100%">
    <l-map
      :max-zoom="18"
      v-model:zoom="zoom_"
      v-model:center="center_"
      :zoomAnimation="true"
      :markerZoomAnimation="true"
      @ready="onLeafletReady"
      :zoomControl="mdAndUp"
    >
      <l-control-layers v-if="tileProviders.length > 1" />

      <l-tile-layer
        v-for="tileProvider in tileProviders"
        :key="tileProvider.name"
        :name="tileProvider.name"
        :url="tileProvider.url"
        :attribution="tileProvider.attribution"
        layer-type="base"
        :visible="tileProvider.visible"
      />
      <!-- 

        v-if="tileProvider.default"
        layer-type="base" -->
    </l-map>
  </div>
</template>
