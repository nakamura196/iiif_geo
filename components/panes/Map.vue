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

interface PropType {
  zoom?: number;
  center?: any;
  /*
  tileProviders?: {
    name: string;
    attribution: string;
    url: string;
    // default?: boolean;
    visible?: boolean;
  }[];
  */
  height?: number;
  width?: number;
}

const { t } = useI18n();

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
    // default: true,
    visible: false,
  },
  {
    name: t("空中写真"),
    attribution: t("国土地理院ウェブサイト"),
    url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    // default: false,
    visible: false,
  },
];

// Leaflet マップの準備ができたかどうかを追跡
const leafletReady = ref(false);

// MarkerCluster グループのインスタンス
let markerCluster: MarkerClusterGroup | null = null;

const zoom_ = ref(props.zoom);
const center_ = ref(props.center);

const { canvas, featuresMap, action } = useSettings();
const { settings } = usePanes();

let markers: any[] = [];

const map = ref<Map | null>(null);

/*
const setMap = (leafletMapObject: Map) => {
  map.value = leafletMapObject;
};
*/

// Leaflet マップの準備ができた際の処理
const onLeafletReady = (map: L.Map) => {
  leafletReady.value = true;
  initializeMarkerCluster(map);
  display();
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
  let xs = [];
  let ys = [];

  const features = canvas.value.annotations[0].items[0].body.features;

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
            <div>ID: ${feature.id}</div>
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
                      }">${"detail"}</a>`
                    : ""
                }
            </div>
        </div>`
    );

    markers.push(marker);
  }

  // 中心座標の計算
  const centerX = xs.reduce((acc, val) => acc + val, 0) / xs.length; // 緯度の平均
  const centerY = ys.reduce((acc, val) => acc + val, 0) / ys.length; // 経度の平均

  // 中心座標をセット
  center_.value = [centerX, centerY];

  markerCluster.addLayers(markers);
};

const updateMapSize = () => {
  nextTick(() => {
    map.value?.invalidateSize();
  });
};

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
