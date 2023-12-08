<script setup lang="ts">
import { mdiMagnify, mdiImageFilterCenterFocus } from "@mdi/js";

interface Item {
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

const {t} = useI18n();

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

const items: Item[] = [];

const search = ref("");

const { canvas, action } = useSettings();

const features = canvas.value.annotations[0].items[0].body.features;

for (const feature of features) {
  // .slice(0, 10)

  const metadata = feature.metadata || {};

  items.push({
    id: feature.id,
    name: metadata.label,
    tag: metadata.tags?.join(",") || "",
  });
}

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
      <template v-slot:item.btn="{ item }">
        <v-btn
          class="ma-1"
          color="primary"
          size="small"
          @click="select(item.id)"
        >
          <v-icon>{{ mdiImageFilterCenterFocus }}</v-icon>
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>
