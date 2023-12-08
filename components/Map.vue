<script setup lang="ts">
import L from "leaflet";
import { Map } from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { LMap, LTileLayer, LControlLayers } from "@vue-leaflet/vue-leaflet";

interface PropType {
  zoom?: number;
  center?: any;
  tileProviders?: {
    name: string;
    attribution: string;
    url: string;
    // default?: boolean;
    visible?: boolean;
  }[];
  height?: number;
  width?: number;
}

const props = withDefaults(defineProps<PropType>(), {
  zoom: 6,
  center: () => [54, 28],
  tileProviders: () => [
    {
      name: "国土地理院ウェブサイト",
      attribution: "国土地理院ウェブサイト",
      url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
      // default: true,
      visible: true,
    },
    {
      name: "空中写真",
      attribution: "国土地理院ウェブサイト",
      url: "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
      // default: false,
      visible: false,
    },
    /*
    {
      name: "OpenStreetMap",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
    */
  ],
  coordinates: () => [],
  popup: true,
  height: 0,
  width: 0,
});

const zoom_ = ref(props.zoom);
const center_ = ref(props.center);

const { canvas, featuresMap, action } = useSettings();
const { settings } = usePanes();

let markers: any[] = [];

const map = ref<Map | null>(null);

const setMap = (leafletMapObject: Map) => {
  map.value = leafletMapObject;
};

onMounted(() => {
  L.Map.addInitHook(function () {
    const markerCluster = L.markerClusterGroup({
      removeOutsideVisibleBounds: true,
      chunkedLoading: true,
    }).addTo(this);

    let x = 0;
    let y = 0;

    const features = canvas.value.annotations[0].items[0].body.features;

    markers = [];

    for (const feature of features) {
      const coordinates = feature.geometry.coordinates;
      const marker = L.marker(coordinates);

      // @ts-ignore
      marker.id = feature.id;

      marker.on("click", () => {
        const id = feature.id;

        action.value = {
          type: "map",
          id,
        };
      });

      x += coordinates[0];
      y += coordinates[1];

      const popup = L.popup();
      marker.bindPopup(popup);

      const metadata = feature.metadata || {};

      popup.setContent(
        `<div>
            <div>ID: ${feature.id}</div>
            ${metadata.label ? `<div style="margin-top: 4px;">名前: ${metadata.label}</div>` : ""}
            ${metadata.tags ? `<div style="margin-top: 4px;">タグ: ${metadata.tags.join(",")}</div>` : ""}
            <div style="margin-top: 8px;">
                ${
                  metadata.url
                    ? `<a target="_blank" href="${metadata.url}">詳細</a>`
                    : ""
                }
            </div>
        </div>`
      );

      markers.push(marker);
    }

    center_.value = [x / features.length, y / features.length];

    markerCluster.addLayers(markers);
  });
});

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

      center_.value = coordinates;

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
      :max-zoom="19"
      v-model:zoom="zoom_"
      v-model:center="center_"
      :zoomAnimation="true"
      :markerZoomAnimation="true"
      @ready="setMap"
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
