<script setup lang="ts">
import L from "leaflet";
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
  }[];
}

const props = withDefaults(defineProps<PropType>(), {
  zoom: 6,
  center: () => [54, 28],
  tileProviders: () => [
    {
      name: "国土地理院ウェブサイト",
      attribution: "国土地理院ウェブサイト",
      url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    },
    {
      name: "OpenStreetMap",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
  ],
  coordinates: () => [],
  popup: true,
});

const zoom_ = ref(props.zoom);
const center_ = ref(props.center);

const { canvas, action } = useSettings();

watch(
  () => canvas.value,
  (value) => {
    if(!canvas.value.items) {
        return
    }
    L.Map.addInitHook(function () {
      const markerCluster = L.markerClusterGroup({
        removeOutsideVisibleBounds: true,
        chunkedLoading: true,
      }).addTo(this);

      let markers = [];

      let x = 0;
      let y = 0;

      const features = canvas.value.annotations[0].items[0].body.features;

      for (const feature of features) {
        const coordinates = feature.geometry.coordinates;
        const marker = L.marker(coordinates);

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

        popup.setContent(
          `<a target="_blank" href="#${feature.id}">${feature.label}</a>`
        );

        markers.push(marker);
      }

      center_.value = [x / features.length, y / features.length];

      markerCluster.addLayers(markers);
    });
  }
);

onMounted(() => {});
</script>

<template>
  <l-map
    :max-zoom="19"
    v-model:zoom="zoom_"
    v-model:center="center_"
    :zoomAnimation="true"
    :markerZoomAnimation="true"
  >
    <l-control-layers v-if="tileProviders.length > 1" />

    <l-tile-layer
      v-for="tileProvider in tileProviders"
      :key="tileProvider.name"
      :name="tileProvider.name"
      :url="tileProvider.url"
      :attribution="tileProvider.attribution"
      layer-type="base"
    />
  </l-map>
</template>
