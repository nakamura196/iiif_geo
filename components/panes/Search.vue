<script setup lang="ts">
import { mdiMagnify, mdiImageFilterCenterFocus } from "@mdi/js";

interface Item {
  uuid: string;
  id: string;
  name: string;
  tag: string;
}

interface PropType {
  height?: number;
}

withDefaults(defineProps<PropType>(), {
  height: () => 0,
});

const search = ref("");

const { action, canvases, pageIndex } = useSettings();

const items = computed(() => {
  const items: Item[] = [];
  const features =
    canvases.value[pageIndex.value]?.annotations[0].items[0].body.features ||
    [];

  for (const feature of features) {
    const metadata = feature.metadata || {};

    items.push({
      uuid: feature.id,
      id: metadata.id || feature.id,
      name: metadata.label,
      tag: metadata.tags?.join(",") || "",
    });
  }

  return items;
});

const filteredItems = computed(() => {
  const q = (search.value || "").toLocaleUpperCase();
  if (!q) return items.value;
  return items.value.filter(
    (it) =>
      filterOnlyCapsText(it.id, q) ||
      filterOnlyCapsText(it.name, q) ||
      filterOnlyCapsText(it.tag, q)
  );
});

function kanaToHira(str: string) {
  if (!str) return str;
  if (typeof str !== "string") return str;
  return str.replace(/[\u30a1-\u30f6]/g, function (match) {
    var chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

function filterOnlyCapsText(value: string, query: string) {
  value = kanaToHira(value);
  query = kanaToHira(query);

  const flg =
    value != null &&
    query != null &&
    typeof value === "string" &&
    value.toString().toLocaleUpperCase().indexOf(query) !== -1;
  return flg;
}

const select = (id: string) => {
  action.value = {
    type: "both",
    id,
  };
};

// 選択された行へのスクロール機能を追加
const selectedRowRef = ref(null);

// actionが変更されたときに該当行にスクロールする
watch(() => action.value?.id, (newId) => {
  if (newId) {
    // 次のティックで実行してDOMが更新された後にスクロールするようにする
    nextTick(() => {
      const selectedRow = document.querySelector('.selected-row');
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
}, { immediate: true });
</script>

<template>
  <div class="p-4" :style="`height: ${height}px; overflow-y: auto;`">
    <div class="mb-4 mt-2 flex items-center gap-2">
      <DsIcon :path="mdiMagnify" size="1.25rem" class="text-foreground-muted" />
      <input
        v-model="search"
        :placeholder="$t('search')"
        class="ds-input focus:ds-input-focus flex-1"
      />
    </div>

    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-border text-left text-foreground-muted">
          <th class="px-2 py-1">ID</th>
          <th class="px-2 py-1">{{ $t('name') }}</th>
          <th class="px-2 py-1">{{ $t('tag') }}</th>
          <th class="px-2 py-1"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in filteredItems"
          :key="item.uuid"
          class="border-b border-border"
          :class="{ 'selected-row': item.uuid === action.id }"
        >
          <td class="px-2 py-1">{{ item.id }}</td>
          <td class="px-2 py-1">{{ item.name }}</td>
          <td class="px-2 py-1">{{ item.tag }}</td>
          <td class="px-2 py-1">
            <DsIconButton
              :icon="mdiImageFilterCenterFocus"
              variant="primary"
              size="sm"
              :label="$t('search')"
              @click="select(item.uuid)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.selected-row {
  background-color: var(--color-surface-muted);
}
</style>
