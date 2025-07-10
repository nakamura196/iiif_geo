<script setup lang="ts">
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";

import { mdiChevronDown, mdiCog } from "@mdi/js";

const { settings, panesConfig } = usePanes();

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

onMounted(() => {
  window.addEventListener("resize", () => {
    windowHeight.value = window.innerHeight - props.offset;
    windowWidth.value = window.innerWidth;
    isMobile.value = window.innerWidth < 768;
  });
});

const barHeight = computed(() => isMobile.value ? 40 : 48);

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

const layoutHeight = 0; // 32

function getLabel(id: string) {
  let label = "";
  panesConfig.value.forEach((pane) => {
    if (pane.id === id) {
      label = pane.label || "";
    }
  });

  return label;
}
</script>
<template>
  <div>
    <splitpanes
      @resize="resizeH($event)"
      :style="`height: ${windowHeight - barHeight}px`"
      class2="default-theme"
      :horizontal="isMobile"
    >
      <pane :size="item.size" v-for="(item, c) in items">
        <splitpanes horizontal @resize="resizeV($event, c)">
          <pane :size="e.size" v-for="e in item.items">
            <v-layout :style="`height: ${layoutHeight}px`">
              <v-system-bar window>
                <!-- <v-icon icon="mdi-message" class="me-2"></v-icon> -->

                <span>{{ getLabel(e.componentKey) }}</span>

                <v-spacer></v-spacer>

                <!--

                <v-spacer></v-spacer>

                <v-btn variant="text">
                  <v-icon>{{ mdiMinus }}</v-icon>
                </v-btn>

                <v-btn variant="text" class="ms-2">
                  <v-icon>{{ mdiCheckboxBlankOutline }}</v-icon>
                </v-btn>

                <v-btn variant="text" class="ms-2">
                  <v-icon>{{ mdiClose }}</v-icon>
                </v-btn>
                -->

                <v-btn variant="flat" class="ma-1" :size="isMobile ? 'x-small' : 'x-small'">
                  <!--  class="ms-2" -->
                  <v-icon :size="isMobile ? 'small' : 'default'">{{ mdiCog }}</v-icon>
                </v-btn>

                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      variant="flat"
                      class="ma-1"
                      :size="isMobile ? 'x-small' : 'x-small'"
                    >
                      <!--  class="ms-2" -->
                      <v-icon :size="isMobile ? 'small' : 'default'">{{ mdiChevronDown }}</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(item, index) in panesConfig"
                      :key="index"
                      :value="item.id"
                      @click="
                        () => {
                          e.componentKey = item.id;
                        }
                      "
                    >
                      <v-list-item-title>{{ item.label }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-system-bar>
            </v-layout>

            <component
              :height="
                isMobile
                  ? ((windowHeight - barHeight) * item.size) / 100 - layoutHeight
                  : ((windowHeight - barHeight) * e.size) / 100 - layoutHeight
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
  background-color: #ccc;
  position: relative;
}

/* モバイル向けのスプリッター調整 */
@media (max-width: 767px) {
  .splitpanes--horizontal > .splitpanes__splitter {
    height: 8px;
    background-color: #999;
    cursor: ns-resize;
  }
  
  .splitpanes--vertical > .splitpanes__splitter {
    width: 8px;
    background-color: #999;
    cursor: ew-resize;
  }
}
.splitpanes__splitter:before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  transition: opacity 0.4s;
  background-color: rgba(255, 0, 0, 0.3);
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
