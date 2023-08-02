<script setup lang="ts">
import { mdiMagnify, mdiImageFilterCenterFocus } from "@mdi/js";

interface PropType {
  height?: number;
}

withDefaults(defineProps<PropType>(), {
  height: () => 0,
});

const itemsPerPage = ref(100);
const headers = [
  { title: "ID", key: "id" },
  {
    title: "名前",
    key: "name",
  },
  {
    title: "",
    key: "btn",
  },
];

const desserts = [];

const search = ref("");

const { canvas, action } = useSettings();

const features = canvas.value.annotations[0].items[0].body.features;

for (const feature of features) {
  // .slice(0, 10)
  desserts.push({
    id: feature.id,
    name: feature.label,
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

function filterOnlyCapsText(value: string, query: string, item) {
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
      label="Search"
      single-line
      hide-details
      variant="outlined"
      density="compact"
      class="mt-2 mb-4"
    ></v-text-field>

    <v-data-table
      :custom-filter="filterOnlyCapsText"
      :_height="height"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="desserts"
      item-value="id"
      density="compact"
      :search="search"
    >
      <template v-slot:item.btn="{ item }">
        <v-btn
          class="ma-1"
          color="primary"
          size="small"
          @click="select(item.columns.id)"
        >
          <v-icon>{{ mdiImageFilterCenterFocus }}</v-icon>
          <!-- フォーカス class="mr-1" -->
        </v-btn>
      </template>
    </v-data-table>
  </div>
</template>
