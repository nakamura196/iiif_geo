<script setup lang="ts">
import { mdiMagnify, mdiImageFilterCenterFocus, mdiFilterVariant } from "@mdi/js";
import { useI18n } from "vue-i18n";

interface Item {
  uuid: string;
  id: string;
  name: string;
  tag: string;
  tags: string[];
  thumbnail: string;
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
  { title: "", key: "thumbnail", width: "50px" },
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
const selectedTags = ref<string[]>([]);

const { action, canvases, pageIndex } = useSettings();

// 全アイテムを取得
const allItems = computed(() => {
  const items: Item[] = [];
  const features =
    canvases.value[pageIndex.value]?.annotations?.[0]?.items?.[0]?.body?.features ||
    [];

  for (const feature of features) {
    // 新フォーマット (LPF/properties) と旧フォーマット (metadata) の両方をサポート
    const metadata = feature.metadata || {};
    const props = feature.properties || {};
    const tagsArray = props.tags || metadata.tags || [];
    // depictions: feature.depictions (LPF)
    const depictions = feature.depictions || [];
    const thumbnail = depictions.length > 0 ? depictions[0]["@id"] : "";

    items.push({
      uuid: feature.id,
      // ID: id (GeoJSON標準) > @id (LPF) > metadata.id > feature.id
      id: feature.id || feature["@id"] || metadata.id,
      // title: properties.title (推奨) > metadata.label (レガシー)
      name: props.title || metadata.label,
      // tags: properties.tags (推奨) > metadata.tags (レガシー)
      tag: tagsArray.join(",") || "",
      tags: tagsArray,
      thumbnail,
    });
  }

  return items;
});

// ユニークなタグ一覧を取得（件数付き、多い順）
const availableTags = computed(() => {
  const tagCount: { [key: string]: number } = {};
  for (const item of allItems.value) {
    for (const tag of item.tags) {
      if (tag) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
  }
  // 件数が多い順にソート
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({
      title: `${tag} (${count})`,
      value: tag,
    }));
});

// タグでフィルタリングされたアイテム
const items = computed(() => {
  if (selectedTags.value.length === 0) {
    return allItems.value;
  }
  return allItems.value.filter(item =>
    selectedTags.value.some(tag => item.tags.includes(tag))
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
  <div class="pa-4" :style="`height: ${height}px; overflow-y: auto;`">
    <v-text-field
      v-model="search"
      :append-icon="mdiMagnify"
      :label="$t('search')"
      single-line
      hide-details
      variant="outlined"
      density="compact"
      class="mt-2 mb-2"
      clearable
    ></v-text-field>

    <v-select
      v-if="availableTags.length > 0"
      v-model="selectedTags"
      :items="availableTags"
      item-title="title"
      item-value="value"
      :label="$t('filterByTag')"
      :prepend-inner-icon="mdiFilterVariant"
      multiple
      chips
      closable-chips
      clearable
      variant="outlined"
      density="compact"
      class="mb-2"
      hide-details
    ></v-select>

    <div class="text-caption text-grey mb-2">
      {{ items.length }} {{ $t('件') }}
      <span v-if="selectedTags.length > 0 || search">
        / {{ allItems.length }} {{ $t('件') }}
      </span>
    </div>

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
          <td>
            <v-img
              v-if="item.thumbnail"
              :src="item.thumbnail"
              width="40"
              height="40"
              cover
              class="rounded"
            ></v-img>
          </td>
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
