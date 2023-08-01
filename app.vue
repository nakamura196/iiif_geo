<script setup lang="ts">
const height = ref(0);

const { canvas, featuresMap } = useSettings();

const baseURL = useNuxtApp().$config.app.baseURL;

const ok = ref(false);

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

  ok.value = true;
});
</script>
<template>
  <v-app>
    <v-app-bar color="purple" flat :absolute="true" density="compact">
      <!-- :absolute="false" -->
      <v-toolbar-title> IIIF Georeference Viewer </v-toolbar-title>
    </v-app-bar>
    <v-main>
      <v-row density="compact" class="ma-0">
        <v-col class="pa-0">
          <Map v-if="ok" :style="`height: ${height - 48}px`"></Map>
        </v-col>
        <v-col class="pa-0">
          <Osd v-if="ok" :style="`height: ${height - 48}px`"></Osd>
        </v-col>
      </v-row>
    </v-main>
    <!-- 
    <div :style="`height: ${height - 48}px`" v-if="height > 0">
      
      <div style="display: inline-block; width: 50%; height: 100%">
        <Map v-if="ok"></Map>
      </div>
      <div
        style="display: inline-block; width: 50%; float: right"
        :style="`height: ${100}%`"
      >
        <Osd v-if="ok"></Osd>
      </div>
    </div>
    -->
  </v-app>
</template>
<!-- 
<style>
body {
  margin: 0;
}
</style>
-->
