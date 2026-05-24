<script setup lang="ts">
import { mdiMagnify, mdiImageFilterCenterFocus, mdiFilterVariant } from "@mdi/js";

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
  return allItems.value.filter((item) =>
    selectedTags.value.some((tag) => item.tags.includes(tag))
  );
});

// さらにテキスト検索で絞り込み
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

const toggleTag = (tag: string) => {
  const i = selectedTags.value.indexOf(tag);
  if (i === -1) {
    selectedTags.value.push(tag);
  } else {
    selectedTags.value.splice(i, 1);
  }
};

function kanaToHira(str: string) {
  if (!str) return str;
  if (typeof str !== "string") return str;
  return str.replace(/[ァ-ヶ]/g, function (match) {
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

// actionが変更されたときに該当行にスクロールする
watch(
  () => action.value?.id,
  (newId) => {
    if (newId) {
      // 次のティックで実行してDOMが更新された後にスクロールするようにする
      nextTick(() => {
        const selectedRow = document.querySelector(".selected-row");
        if (selectedRow) {
          selectedRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="p-4" :style="`height: ${height}px; overflow-y: auto;`">
    <div class="mb-3 mt-2 flex items-center gap-2">
      <DsIcon :path="mdiMagnify" size="1.25rem" class="text-foreground-muted" />
      <input
        v-model="search"
        :placeholder="$t('search')"
        class="ds-input focus:ds-input-focus flex-1"
      />
    </div>

    <!-- タグ絞り込み（件数付き・多い順、クリックでトグル） -->
    <div v-if="availableTags.length > 0" class="mb-3">
      <div class="mb-1 flex items-center gap-1 text-xs text-foreground-muted">
        <DsIcon :path="mdiFilterVariant" size="1rem" />
        {{ $t("filterByTag") }}
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="tag in availableTags"
          :key="tag.value"
          type="button"
          class="rounded-full border px-2.5 py-0.5 text-xs transition-colors"
          :class="
            selectedTags.includes(tag.value)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border text-foreground-muted hover:bg-surface-muted'
          "
          @click="toggleTag(tag.value)"
        >
          {{ tag.title }}
        </button>
      </div>
    </div>

    <div class="mb-2 text-xs text-foreground-muted">
      {{ filteredItems.length }}
      <span v-if="selectedTags.length > 0 || search"
        >/ {{ allItems.length }}</span
      >
    </div>

    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-border text-left text-foreground-muted">
          <th class="px-2 py-1"></th>
          <th class="px-2 py-1">ID</th>
          <th class="px-2 py-1">{{ $t("name") }}</th>
          <th class="px-2 py-1">{{ $t("tag") }}</th>
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
          <td class="px-2 py-1">
            <img
              v-if="item.thumbnail"
              :src="item.thumbnail"
              class="h-10 w-10 rounded object-cover"
              alt=""
            />
          </td>
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
