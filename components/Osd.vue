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

// async
onMounted(async () => {
  console.log("watch canvas");

  if (!canvas.value.items) {
    return;
  }
  const info = canvas.value.items[0].items[0].body.service[0].id + "/info.json";

  const infoJson = await fetch(info).then((res) => res.json());

  const config: any = {
    // sequenceMode: true,
    id: "osd",
    prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
    tileSources: [
      // info
      infoJson,
    ],
  };

  viewer = $OpenSeadragon(config);
});

const rotate = ref(0);

watch(
  () => rotate.value,
  (value) => {
    console.log("watch route");
    viewer.viewport.setRotation(-1 * value);
  }
);

const update = () => {
  rotate.value = Number((document.querySelector("input") as any).value);
};

const init = () => {
  rotate.value = 0;
  rotate2.value = 0;
};

const rotate2 = ref(0);
</script>
<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="padding: 8px; flex: 0 0 auto">
      <input
        type="range"
        step="1"
        min="-180"
        max="180"
        v-model="rotate2"
        @change="update()"
      />

      <button style="margin-left: 8px; margin-right: 8px" @click="init()">
        初期値
      </button>

      <span> 角度: {{ rotate2 }} </span>
    </div>

    <div
      id="osd"
      :style="`flex-grow: 1; flex-basis: 0; background-color: #000000;`"
    ></div>
  </div>
</template>
