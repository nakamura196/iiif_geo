<script setup lang="ts">
const height = ref(0);

const { canvas, featuresMap } = useSettings();

const baseURL = useNuxtApp().$config.app.baseURL;

onMounted(async () => {
  height.value = window.innerHeight;

  window.addEventListener("resize", () => {
    height.value = window.innerHeight;
  });

  const path = baseURL + "/canvas.json";

  const data = await fetch(path).then((res) => res.json());

  const features = data.annotations[0].items[0].body.features;

  const _featuresMap: any = {};

  for (const feature of features) {
    _featuresMap[feature.id] = feature;
  }

  canvas.value = data;
  featuresMap.value = _featuresMap;
});
</script>
<template>
  <div :style="`height: ${height * 0.99}px`" v-if="height > 0">
    <div style="display: inline-block; width: 50%; height: 100%">
      <Map></Map>
    </div>
    <div style="display: inline-block; width: 50%; float: right;" :style="`height: ${100}%`">
      <Osd></Osd>
    </div>
  </div>
</template>
<style>
body {
  margin: 0;
}
</style>
