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

const itemsPerPage = ref(100);

const { t } = useI18n();

const headers = [
  { title: "ID", key: "id" },
  {
    title: t("name"),
    key: "name",
  },
  {
    title: t("tag"),
    key: "tag",
  },
  {
    title: "",
    key: "btn",
  },
];

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
  <div class="pa-4" :style="`height: ${height}px; overflow-y: auto;`">
    <v-text-field
      v-model="search"
      :append-icon="mdiMagnify"
      :label="$t('search')"
      single-line
      hide-details
      variant="outlined"
      density="compact"
      class="mt-2 mb-4"
      clearable
    ></v-text-field>

    <v-data-table
      :custom-filter="filterOnlyCapsText"
      :_height="height"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="items"
      item-value="id"
      density="compact"
      :search="search"
    >
      <template v-slot:item="{ item, index }">
        <tr :class="{ 'selected-row': item.uuid === action.id }">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.tag }}</td>
          <td>
            <v-btn
              class="ma-1"
              color="primary"
              size="small"
              @click="select(item.uuid)"
            >
              <v-icon>{{ mdiImageFilterCenterFocus }}</v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.selected-row {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>
