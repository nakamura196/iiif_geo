<script setup lang="ts">
const ready = ref(false);
const { settings, panesConfig } = usePanes();
const { canvas, featuresMap } = useSettings();

const baseURL = useNuxtApp().$config.app.baseURL;

let defaultPanes: any[] = [
  {
    size: 50,
    items: [
      {
        id: "0-0",
        componentKey: "Map",
      },
    ],
  },
  {
    size: 50,
    items: [
      {
        id: "1-0",
        componentKey: "Osd",
      },
    ],
  }
];
settings.value.panes = defaultPanes;

onMounted(async () => {
  

  const path = baseURL + "/canvas.json";

  const data = await fetch(path).then((res) => res.json());

  const features = data.annotations[0].items[0].body.features;

  const _featuresMap: any = {};

  for (const feature of features) {
    _featuresMap[feature.id] = feature;
  }

  canvas.value = data;
  featuresMap.value = _featuresMap;

  ready.value = true;
});


</script>
<template>
  <v-app>
    <Header></Header>

    <v-main>
      <PanesMain v-if="ready"></PanesMain>
    </v-main>
  </v-app>
</template>
