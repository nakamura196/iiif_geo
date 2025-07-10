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
  const existingParams = ['u', 'annotations', 'zoom', 'centerX', 'centerY', 'rotation', 'id'];
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

// Leaflet マップの準備ができた際の処理
const onLeafletReady = (mapInstance: L.Map) => {
  leafletReady.value = true;
  map.value = mapInstance;
  initializeMarkerCluster(mapInstance);
  
  // URLパラメータから初期状態を復元
  const query = route.query;
  if (query.mapZoom) {
    const mapZoom = parseInt(query.mapZoom as string);
    if (!isNaN(mapZoom)) {
      zoom_.value = mapZoom;
    }
  }
  if (query.mapLat && query.mapLng) {
    const mapLat = parseFloat(query.mapLat as string);
    const mapLng = parseFloat(query.mapLng as string);
    if (!isNaN(mapLat) && !isNaN(mapLng)) {
      center_.value = [mapLat, mapLng];
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
  
  // URLにIDが指定されている場合、その位置を中心に表示
  if (query.id) {
    const id = query.id as string;
    // featuresMapが準備できるまで監視（デプロイ環境対応）
    let attempts = 0;
    const maxAttempts = 100; // 10秒間待機
    const checkFeature = () => {
      attempts++;
      
      if (Object.keys(featuresMap.value).length > 0 && featuresMap.value[id]) {
        const feature = featuresMap.value[id];
        if (feature.geometry?.coordinates) {
          // URLパラメータで座標が指定されていない場合のみ、IDの位置に移動
          if (!query.mapLat || !query.mapLng) {
            // GeoJSONの座標は[longitude, latitude]の順序
            const lng = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];
            center_.value = [lat, lng]; // Leafletは[latitude, longitude]の順序
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
    });
    map.addLayer(markerCluster);
  }
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
    const coordinates = feature.geometry.coordinates;

    if (!coordinates[0] || !coordinates[1]) {
      continue;
    }

    const marker = L.marker([coordinates[1], coordinates[0]]);

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

    const metadata = feature.metadata || {};

    popup.setContent(
      `<div>
            <div>ID: ${metadata.id || feature.id}</div>
            ${
              metadata.label
                ? `<div style="margin-top: 4px;">${t("name")}: ${
                    metadata.label
                  }</div>`
                : ""
            }
            ${
              metadata.tags
                ? `<div style="margin-top: 4px;">${t(
                    "tag"
                  )}: ${metadata.tags.join(",")}</div>`
                : ""
            }
            <div style="margin-top: 8px;">
                ${
                  metadata.url
                    ? `<a target="_blank" href="${
                        metadata.url
                      }">${t("detail")}</a>`
                    : ""
                }
            </div>
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

      const coordinates = feature.geometry.coordinates;

      center_.value = [coordinates[1], coordinates[0]];

      for (const marker of markers) {
        let iconUrl =
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
        if (marker.id === value.id) {
          iconUrl =
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";

          /*
          window.setTimeout(function () {
            marker.openPopup();
          }, 1000 / 2);
          */
          //
        }

        marker.setIcon(
          L.icon({
            iconUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41], // アイコンのアンカーポイントを指定します。
            popupAnchor: [0, -41], // ポップアップのアンカーポイントを指定します。
          })
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
