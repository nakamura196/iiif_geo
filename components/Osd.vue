<script lang="ts" setup>
const { $OpenSeadragon } = useNuxtApp();

const { canvas, featuresMap, action } = useSettings();

let viewer: any = null;

watch(
  () => action.value,
  (value) => {
    console.log("watch action");
    console.log({ value });

    if (value.type === "map") {
      const feature = featuresMap.value[value.id];

      const resourceCoords = feature.properties.resourceCoords;

      const x = resourceCoords[0];
      const y = resourceCoords[1];

      const viewport = viewer.viewport;

      const point = viewport.imageToViewportCoordinates(x, y);

      viewport.panTo(point);
    }
  }
);

watch(
  () => canvas.value,
  (value) => {
    console.log("watch canvas");

    if (!canvas.value.items) {
      return;
    }
    const info =
      canvas.value.items[0].items[0].body.service[0].id + "/info.json";

    const config: any = {
      sequenceMode: true,
      id: "osd",
      prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
      tileSources: [info],
    };

    viewer = $OpenSeadragon(config);
  }
);

// async
onMounted(() => {});

const rotate = ref(0);

watch(
  () => rotate.value,
  (value) => {
    console.log("watch route");
    viewer.viewport.setRotation(value);
  }
);
</script>
<template>
  <div style="height: 100%">
    <input
      label="角度"
      type="range"
      step="5"
      min="-180"
      max="180"
      v-model="rotate"
    />

    角度: {{ rotate }}

    <div id="osd" :style="`height: 80%;`"></div>
  </div>
</template>
