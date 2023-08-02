<script lang="ts" setup>
import {
  mdiPlus,
  mdiMinus,
  mdiHome,
  mdiFullscreen,
  mdiRestore,
  mdiEye,
  mdiEyeOff,
  mdiMessage,
  mdiMessageOff,
} from "@mdi/js";

const { $OpenSeadragon } = useNuxtApp();

const { canvas, featuresMap, action } = useSettings();

let viewer: any = null;

watch(
  () => action.value,
  (value) => {
    if (value.type === "map" || value.type === "both") {
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
    zoomInButton: "zoom-in",
    zoomOutButton: "zoom-out",
    homeButton: "home",
    fullPageButton: "full-page",
    nextButton: "next",
    previousButton: "previous",
  };

  viewer = $OpenSeadragon(config);
});

const rotate = ref(0);
const rotate2 = ref(0);
const showAnnotations = ref(false);

watch(
  () => rotate.value,
  (value) => {
    viewer.viewport.setRotation(-1 * value);
  }
);

watch(
  () => showAnnotations.value,
  (value) => {
    if (value) {
      const features = featuresMap.value;

      const fullWidth = viewer.world.getItemAt(0).getContentSize().x;

      for (const id in features) {
        const feature = features[id];

        const xywh = feature.xywh.split(",");
        const x = Number(xywh[0]) / fullWidth;
        const y = Number(xywh[1]) / fullWidth;
        const width = Number(xywh[2]) / fullWidth;
        const height = Number(xywh[3]) / fullWidth;

        const overlay = {
          id,
          x,
          y,
          width,
          height,
          className: "osdc-highlight osdc-base",
        };

        viewer.addOverlay(overlay);

        new $OpenSeadragon.MouseTracker({
          element: overlay.id,
          clickHandler: function (e: any) {
            if (e) {
              const id = e.originalTarget.id;

              removeSelected();

              setSelected(id);

              action.value = {
                type: "osd",
                id,
              };
            }
          },
        });
      }
    } else {
      viewer.clearOverlays();
    }
  }
);

function setSelected(id: string) {
  const e = document.getElementById(id);
  if (e) {
    e.classList.add("osdc-selected");
  }
}

function removeSelected() {
  const e2 = document.getElementsByClassName("osdc-selected");
  for (let i = 0; i < e2.length; i++) {
    e2[i].classList.remove("osdc-selected");
  }
}

const update = () => {
  rotate.value = rotate2.value; // Number((document.querySelector("input") as any).value);
};

const init = () => {
  rotate.value = 0;
  rotate2.value = 0;
};
</script>
<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="padding: 8px; flex: 0 0 auto">
      <v-btn class="ma-1" size="small" icon id="zoom-in">
        <v-icon>{{ mdiPlus }}</v-icon>
      </v-btn>
      <v-btn class="ma-1" size="small" icon id="zoom-out">
        <v-icon>{{ mdiMinus }}</v-icon>
      </v-btn>
      <v-btn class="ma-1" size="small" icon id="home">
        <v-icon>{{ mdiHome }}</v-icon>
      </v-btn>
      <v-btn class="ma-1" size="small" icon id="full-page">
        <v-icon>{{ mdiFullscreen }}</v-icon>
      </v-btn>
      <v-btn class="ma-1" size="small" icon @click="init()">
        <v-icon>{{ mdiRestore }}</v-icon>
      </v-btn>
      <v-btn
        class="ma-1"
        size="small"
        icon
        @click="showAnnotations = !showAnnotations"
      >
        <v-icon>{{ showAnnotations ? mdiMessage : mdiMessageOff }}</v-icon>
      </v-btn>

      <v-slider
        v-model="rotate2"
        :max="180"
        :step="1"
        :min="-180"
        label="角度"
        hide-details
        class="ma-1"
        @update:modelValue="update()"
      >
        <template v-slot:append>
          <v-text-field
            v-model="rotate2"
            type="number"
            style="width: 100px"
            density="compact"
            hide-details
            variant="outlined"
            @update:modelValue="update()"
          ></v-text-field>
        </template>
      </v-slider>

      <!-- 
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
      -->
    </div>

    <div
      id="osd"
      :style="`flex-grow: 1; flex-basis: 0; background-color: #000000;`"
    ></div>
  </div>
</template>
<style scoped>
:deep(.osdc-highlight) {
  outline: solid #03a9f4;
}

:deep(.osdc-selected) {
  outline: solid #ffeb3b !important;
}

:deep(.osdc-hover) {
  outline: solid #9c27b0;
}

:deep(.osdc-base:hover, .osdc-base:focus) {
  outline: solid #9c27b0;
}
</style>
