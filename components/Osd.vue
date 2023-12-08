<script lang="ts" setup>
import {
  mdiPlus,
  mdiMinus,
  mdiHome,
  mdiFullscreen,
  mdiRestore,
  // mdiEye,
  // mdiEyeOff,
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

      removeSelected();
      setSelected(value.id);
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

        let overlay: any = null;

        if (!feature.xywh) {
          const resourceCoords = feature.properties.resourceCoords;
          const x = Number(resourceCoords[0]) / fullWidth;
          const y = Number(resourceCoords[1]) / fullWidth;

          const overlay_ = document.createElement("div");
          overlay_.id = id;
          overlay_.className = "pin-icon"; // CSSでスタイルを定義するクラス名

          overlay = {
            id,
            x,
            y,

            /*
            element: overlay_,
            location: new $OpenSeadragon.Point(x, y),
            */
            placement: "RIGHT",
            checkResize: false,
            className: "pin-icon",
          };
        } else {
          const xywh = feature.xywh.split(",");
          const x = Number(xywh[0]) / fullWidth;
          const y = Number(xywh[1]) / fullWidth;
          const width = Number(xywh[2]) / fullWidth;
          const height = Number(xywh[3]) / fullWidth;

          overlay = {
            id,
            x,
            y,
            width,
            height,
            className: "osdc-highlight osdc-base",
          };
        }

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
    if (e.classList.contains("pin-icon")) {
      e.classList.add("pin-selected");
    } else {
      e.classList.add("osdc-selected");
    }
    // e.classList.add("osdc-selected");
  }
}

function removeSelected() {
  const classList = ["pin-selected", "osdc-selected"];
  for (const className of classList) {
    const e = document.getElementsByClassName(className);
    for (let i = 0; i < e.length; i++) {
      e[i].classList.remove(className);
    }
  }

  /*
  const e2 = document.getElementsByClassName("osdc-selected");
  for (let i = 0; i < e2.length; i++) {
    e2[i].classList.remove("osdc-selected");
  }
  */
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
      <v-btn
        class="ma-1"
        size="small"
        icon
        @click="init()"
        :title="/*回転の初期化*/$t('reset')"
      >
        <v-icon>{{ mdiRestore }}</v-icon>
      </v-btn>
      <v-btn
        class="ma-1"
        color="primary"
        size="small"
        icon
        @click="showAnnotations = !showAnnotations"
        :title="/*注釈の表示/非表示*/$t('annotation')"
      >
        <v-icon>{{ showAnnotations ? mdiMessage : mdiMessageOff }}</v-icon>
      </v-btn>

      <v-slider
        v-model="rotate2"
        :max="180"
        :step="1"
        :min="-180"
        :label="/*角度*/$t('angle')"
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
  /* border: 2px solid #ffeb3b !important; */ /* アイコンの境界線 */
}

:deep(.pin-selected) {
  /* outline: solid #ffeb3b !important; */
  /* border: 2px solid #ffeb3b !important; */ /* アイコンの境界線 */
  background-color: #f44336 !important;
}

:deep(.osdc-hover) {
  outline: solid #9c27b0;
}

:deep(.osdc-base:hover, .osdc-base:focus) {
  outline: solid #9c27b0;
}
:deep(.pin-icon) {
  width: 12px; /* アイコンの幅 */
  height: 12px; /* アイコンの高さ */
  background-color: #2196f3; /* アイコンの背景色 */
  /* border: 2px solid #fff; */ /* アイコンの境界線 */
  /* outline: solid #fff;*/ /* 2px */
  border-radius: 50%; /* 円形にする */
  box-shadow: 0 0 2px #333; /* 影をつける */

  /* アイコンを中央に配置するための設定 */
  display: flex;
  align-items: center;
  justify-content: center;

  /* ピンの先端部分を作成 */
  position: relative;
}
</style>
