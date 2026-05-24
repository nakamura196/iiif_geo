<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";

const { settings } = usePanes();

interface PropType {
  offset?: number;
}

const props = withDefaults(defineProps<PropType>(), {
  offset: () => 0,
});

// Window dimensions and mobile detection
const windowHeight = ref(window.innerHeight - props.offset);
const windowWidth = ref(window.innerWidth);

// Mobile breakpoint
const isMobile = ref(window.innerWidth < 768);

// setSize

const items = ref<any>(settings.value.panes);

const setSize = () => {
  // モバイルの場合は垂直分割になるため、サイズを調整
  if (isMobile.value) {
    for (const item of items.value) {
      // モバイルでは各ペインを均等に分割
      item.size = 100 / items.value.length;
      
      for (const item2 of item.items) {
        // ネストされたペインも100%に設定（垂直に積まれるため）
        item2.size = 100;
      }
    }
  } else {
    // デスクトップでは元のロジックを使用
    for (const item of items.value) {
      if (!item.size) {
        item.size = 100 / items.value.length;
      }

      for (const item2 of item.items) {
        if (!item2.size) {
          item2.size = 100 / item.items.length;
        }
      }
    }
  }
};
setSize();

// レスポンシブデザインのためにウィンドウサイズ変更時にサイズを再計算
watch(isMobile, () => {
  setSize();
});

const onResize = () => {
  windowHeight.value = window.innerHeight - props.offset;
  windowWidth.value = window.innerWidth;
  isMobile.value = window.innerWidth < 768;
};
onMounted(() => window.addEventListener("resize", onResize, { passive: true }));
onUnmounted(() => window.removeEventListener("resize", onResize));

// アプリ上部 <Headers/> 分の高さ補正。splitpanes コンテナと各ペインの
// コンポーネント高さをビューポートからこの値だけ差し引いて算出する。
const barHeight = computed(() => (isMobile.value ? 40 : 48));

// ペイン領域に使える実高さ（ビューポート − アプリヘッダー）。
const contentHeight = computed(() => windowHeight.value - barHeight.value);

const resizeV = (e: any, c: number) => {
  for (let i = 0; i < e.length; i++) {
    items.value[c].items[i].size = e[i].size;
  }
};

const resizeH = (e: any) => {
  for (let i = 0; i < e.length; i++) {
    items.value[i].size = e[i].size;
  }
};
</script>
<template>
  <div>
    <splitpanes
      @resize="resizeH($event)"
      :style="`height: ${contentHeight}px`"
      :horizontal="isMobile"
    >
      <pane :size="item.size" v-for="(item, c) in items" :key="c">
        <splitpanes horizontal @resize="resizeV($event, c)">
          <pane :size="e.size" v-for="e in item.items" :key="e.id">
            <component
              :height="
                isMobile
                  ? (contentHeight * item.size) / 100
                  : (contentHeight * e.size) / 100
              "
              :width="isMobile ? windowWidth : (windowWidth * item.size) / 100"
              :key="e.id"
              :id="e.id"
              :is="
                // @ts-ignore
                resolveComponent(e.componentKey)
              "
              v-bind="e.props"
            ></component>
          </pane>
        </splitpanes>
      </pane>
    </splitpanes>
  </div>
</template>
<style>
.splitpanes__splitter {
  background-color: var(--color-border);
  position: relative;
}

/* モバイル向けのスプリッター調整 */
@media (max-width: 767px) {
  .splitpanes--horizontal > .splitpanes__splitter {
    height: 8px;
    background-color: var(--color-border-strong);
    cursor: ns-resize;
  }

  .splitpanes--vertical > .splitpanes__splitter {
    width: 8px;
    background-color: var(--color-border-strong);
    cursor: ew-resize;
  }
}
.splitpanes__splitter:before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.4s;
  background-color: color-mix(in oklab, var(--color-accent) 40%, transparent);
  opacity: 0;
  z-index: 1;
}
.splitpanes__splitter:hover:before {
  opacity: 1;
}
.splitpanes--vertical > .splitpanes__splitter:before {
  right: -10px;

  /* left: -10px; */

  height: 100%;
  z-index: 999;
}
.splitpanes--horizontal > .splitpanes__splitter:before {
  /* top: -10px; */

  /*top: -2px;*/

  bottom: -10px;

  width: 100%;
  z-index: 999;
}
</style>
