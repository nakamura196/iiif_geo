<script lang="ts" setup>
import {
  mdiPlus,
  mdiMinus,
  mdiHome,
  mdiFullscreen,
  mdiRestore,
  mdiMessage,
  mdiMessageOff,
  mdiArrowLeft,
  mdiArrowRight,
  mdiAutoFix,
} from "@mdi/js";
import { calculateImageRotation, calculateImageRotationAdvanced } from "~/utils/calculateImageRotation";
import { useDisplay } from "vuetify";

const { $OpenSeadragon } = useNuxtApp();
const { mobile, mdAndUp } = useDisplay();

const { featuresMap, action, canvases, pageIndex } = useSettings();

let viewer: any = null;

watch(
  () => action.value,
  (value) => {
    if (value.type === "map" || value.type === "both") {
      const feature = featuresMap.value[value.id];

      if (feature && feature.properties?.resourceCoords) {
        const resourceCoords = feature.properties.resourceCoords;

        const x = resourceCoords[0];
        const y = resourceCoords[1];

        const viewport = viewer.viewport;

        const point = viewport.imageToViewportCoordinates(x, y);

        viewport.panTo(point);

        // IDが指定されている場合はアノテーションを自動表示
        if (useRoute().query.id && !showAnnotations.value) {
          showAnnotations.value = true;
          // アノテーション表示後に選択状態を設定
          nextTick(() => {
            removeSelected();
            setSelected(value.id);
          });
        } else {
          removeSelected();
          setSelected(value.id);
        }
      }
    }
    // actionが変更されたらURLを更新
    debouncedUpdateURLParams();
  }
);

// async
onMounted(async () => {
  const index = 0;

  const canvas_ = canvases.value[index];

  const info = canvas_.items[0].items[0].body.service[0].id + "/info.json";

  const infoJson = await fetch(info).then((res) => res.json());

  const tileSources = canvases.value.map((canvas_) => {
    return canvas_.items[0].items[0].body.service[0].id + "/info.json";
  });

  const config: any = {
    id: "osd",
    prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
    sequenceMode: true,
    tileSources,
    zoomInButton: "zoom-in",
    zoomOutButton: "zoom-out",
    homeButton: "home",
    fullPageButton: "full-page",
    nextButton: "next",
    previousButton: "previous",
  };

  viewer = $OpenSeadragon(config);

  const updateFeatureMap = () => {
    const pageIndex_ = pageIndex.value;

    const canvas_ = canvases.value[pageIndex_];

    if (!canvas_) {
      return;
    }

    if (!canvas_.annotations) {
      return;
    }

    const features = canvas_.annotations[0].items[0].body.features;

    const _featuresMap: any = {};

    for (const feature of features) {
      _featuresMap[feature.id] = feature;
    }

    featuresMap.value = _featuresMap;
  };

  viewer.addHandler("open", () => {
    updateFeatureMap();
    
    // featuresMap更新後にイベントを発行
    nextTick(() => {
      // featuresMapが更新されたことを他のコンポーネントに通知
      console.log('[OSD] featuresMap updated, total features:', Object.keys(featuresMap.value).length);
    });
    
    // URLパラメータから初期状態を復元
    const query = route.query;
    if (query.annotations === 'true') {
      showAnnotations.value = true;
    }
    if (query.zoom) {
      const zoom = parseFloat(query.zoom as string);
      if (!isNaN(zoom)) {
        viewer.viewport.zoomTo(zoom);
      }
    }
    // 中央座標の復元
    if (query.centerX && query.centerY) {
      const centerX = parseFloat(query.centerX as string);
      const centerY = parseFloat(query.centerY as string);
      if (!isNaN(centerX) && !isNaN(centerY)) {
        viewer.viewport.panTo(new $OpenSeadragon.Point(centerX, centerY));
      }
    }
    // 回転角度の復元
    if (query.rotation) {
      const rotation = parseFloat(query.rotation as string);
      if (!isNaN(rotation)) {
        rotate.value = rotation;
        rotate2.value = rotation;
      }
    } else {
      // rotateパラメータが未指定の場合は自動回転を実行
      setTimeout(() => {
        if (Object.keys(featuresMap.value).length >= 2) {
          calculateRotation();
        }
      }, 500); // featuresMapが更新されるまで待つ
    }
    // ID選択はプラグインで処理される
  });

  viewer.addHandler(
    "page",
    (value: { eventSource: any; page: number; previousPage: number }) => {
      pageIndex.value = value.page;

      updateFeatureMap();
    }
  );
});

const rotate = ref(0);
const rotate2 = ref(0);
const showAnnotations = ref(false);

const route = useRoute();
const router = useRouter();

watch(
  () => rotate.value,
  (value) => {
    viewer.viewport.setRotation(-1 * value);
    debouncedUpdateURLParams();
  }
);

// URLパラメータを更新する関数
const updateURLParams = () => {
  const params = new URLSearchParams(window.location.search);
  
  // アノテーション表示状態
  if (showAnnotations.value) {
    params.set('annotations', 'true');
  } else {
    params.delete('annotations');
  }
  
  // ズームレベル
  if (viewer && viewer.viewport) {
    const zoom = viewer.viewport.getZoom();
    params.set('zoom', zoom.toFixed(2));
    
    // ビューポートの中央座標
    const center = viewer.viewport.getCenter();
    params.set('centerX', center.x.toFixed(4));
    params.set('centerY', center.y.toFixed(4));
  }
  
  // 回転角度
  params.set('rotation', rotate.value.toString());
  
  // 選択されているIDを追加
  if (action.value.id) {
    params.set('id', action.value.id);
  }
  
  // 既存のパラメータを保持
  if (route.query.u) {
    params.set('u', route.query.u as string);
  }
  // 地図のパラメータも保持
  const mapParams = ['mapZoom', 'mapLat', 'mapLng'];
  for (const param of mapParams) {
    if (route.query[param]) {
      params.set(param, route.query[param] as string);
    }
  }
  
  // URLを更新（History APIを使用してリロードを防ぐ）
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
};

// ズーム変更を監視（デバウンス付き）
let zoomHandler: any = null;
let zoomTimeout: any = null;

const debouncedUpdateURLParams = () => {
  if (zoomTimeout) {
    clearTimeout(zoomTimeout);
  }
  zoomTimeout = setTimeout(() => {
    updateURLParams();
  }, 500); // 500ms のデバウンス
};

// パン（移動）イベントも監視
let panHandler: any = null;

onMounted(() => {
  setTimeout(() => {
    if (viewer) {
      zoomHandler = viewer.addHandler('zoom', () => {
        debouncedUpdateURLParams();
      });
      panHandler = viewer.addHandler('pan', () => {
        debouncedUpdateURLParams();
      });
    }
  }, 1000);
});

onUnmounted(() => {
  if (viewer) {
    if (zoomHandler) {
      viewer.removeHandler('zoom', zoomHandler);
    }
    if (panHandler) {
      viewer.removeHandler('pan', panHandler);
    }
  }
  if (zoomTimeout) {
    clearTimeout(zoomTimeout);
  }
});

watch(
  () => showAnnotations.value,
  (value) => {
    updateURLParams();
    if (value) {
      const features = featuresMap.value;

      const fullWidth = viewer.world.getItemAt(0).getContentSize().x;

      for (const id in features) {
        const feature = features[id];

        let overlay: any = null;

        if (feature.xywh) {
          // deprecated
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
        } else if (feature.metadata?.xywh) {
          const xywh = feature.metadata.xywh.split(",");
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
        } else {
          const resourceCoords = feature.properties.resourceCoords;
          const x = Number(resourceCoords[0]) / fullWidth;
          const y = Number(resourceCoords[1]) / fullWidth;

          const overlay_ = document.createElement("div");
          overlay_.id = id;
          overlay_.className = "pin-icon";

          overlay = {
            id,
            x,
            y,
            placement: "RIGHT",
            checkResize: false,
            className: "pin-icon",
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
}

const update = () => {
  rotate.value = rotate2.value;
};

const init = () => {
  rotate.value = 0;
  rotate2.value = 0;
};

// 180度回転を追加
const rotate180 = () => {
  rotate.value += 180;
  rotate2.value += 180;
  // -180〜180の範囲に正規化
  if (rotate.value > 180) {
    rotate.value -= 360;
    rotate2.value -= 360;
  }
};

// 画像座標と地理座標から回転角度を計算
const calculateRotation = () => {
  const features = Object.values(featuresMap.value);
  if (features.length < 2) {
    return;
  }
  
  // 3点以上ある場合は分布パターンを使用、それ以外は2点間の角度を使用
  const result = features.length >= 3 
    ? calculateImageRotationAdvanced(features as any)
    : calculateImageRotation(features as any);
    
  if (!result) {
    return;
  }
  
  rotate.value = result.rotation;
  rotate2.value = result.rotation;
};
</script>
<template>
  <div style="height: 100%; display: flex; flex-direction: column">
    <div style="padding: 8px; flex: 0 0 auto">
      <!-- モバイルでは基本的なボタンのみ表示 -->
      <v-btn class="ma-1" size="small" icon id="previous">
        <v-icon>{{ mdiArrowLeft }}</v-icon>
      </v-btn>
      <v-btn class="ma-1" size="small" icon id="next">
        <v-icon>{{ mdiArrowRight }}</v-icon>
      </v-btn>
      
      <!-- デスクトップでのみ表示するボタン -->
      <template v-if="mdAndUp">
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
          :title="/*回転の初期化*/ $t('reset')"
        >
          <v-icon>{{ mdiRestore }}</v-icon>
        </v-btn>
        <v-btn
          class="ma-1"
          size="small"
          icon
          @click="calculateRotation()"
          :title="/*自動回転*/ $t('autoRotate')"
          color="secondary"
        >
          <v-icon>{{ mdiAutoFix }}</v-icon>
        </v-btn>
      </template>
      
      <!-- 注釈ボタンはモバイルでも表示 -->
      <v-btn
        class="ma-1"
        color="primary"
        size="small"
        icon
        @click="showAnnotations = !showAnnotations"
        :title="/*注釈の表示/非表示*/ $t('annotation')"
      >
        <v-icon>{{ showAnnotations ? mdiMessage : mdiMessageOff }}</v-icon>
      </v-btn>

      <!-- スライダーはデスクトップのみ -->
      <v-slider
        v-if="mdAndUp"
        v-model="rotate2"
        :max="180"
        :step="1"
        :min="-180"
        :label="/*角度*/ $t('angle')"
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
