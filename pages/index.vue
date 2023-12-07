<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";

interface PanesConfig {
  id?: string;
  label?: string;
  size?: number;
  items?: PanesConfig[];
  componentKey?: string;
}

const ready = ref(false);
const { settings } = usePanes();
const { canvas, featuresMap, title } = useSettings();

const snackbar = ref(false);

let defaultPanes: PanesConfig[] = [
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
  },
];
settings.value.panes = defaultPanes;

const route = useRoute();

const display = async () => {
  const route = useRoute();
  const url = route.query.u as string;
  if (!url) {
    return;
  }

  try {
    const data = await fetch(url).then((res) => res.json());

    const features = data.annotations[0].items[0].body.features;

    const labelMap = data.label;
    for (const key in labelMap) {
      const label = labelMap[key];
      if (label) {
        // features[key].label = label
        title.value = label[0];
      }
    }

    const _featuresMap: any = {};

    for (const feature of features) {
      if (!feature.id) {
        feature.id = uuidv4();
      }

      if (!feature.label) {
        feature.label = "";
      }
      _featuresMap[feature.id] = feature;
    }

    canvas.value = data;
    featuresMap.value = _featuresMap;

    ready.value = true;
  } catch (e) {
    snackbar.value = true;
  }
};

watch(
  () => route.fullPath,
  () => {
    // 初期化

    canvas.value = {
      items: [],
      annotations: [],
    };

    ready.value = false;
    title.value = "";

    display();
  },
  { immediate: true }
);
</script>
<template>
  <v-app>
    <Header></Header>

    <v-main>
      <template v-if="ready">
        <PanesMain></PanesMain>
      </template>
      <template v-else>
        <InputForm></InputForm>
      </template>

      <v-snackbar v-model="snackbar">
        {{ "URLが不正です。" }}

        <template v-slot:actions>
          <v-btn color="pink" variant="text" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>
