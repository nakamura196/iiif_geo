<script setup lang="ts">
import { mdiMagnify, mdiChevronUp, mdiChevronDown, mdiImageFilterCenterFocus } from "@mdi/js";
const dialog = ref(false);

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

for (const feature of features) { // .slice(0, 10)
  desserts.push({
    id: feature.id,
    name: feature.label,
  });
}

function kanaToHira(str: string) {
    if(!str) return str;
    if(typeof str !== 'string') return str;
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
    type: "map",
    id,
  };
};

const showTable = ref(true);
</script>
<template>
  <v-app-bar color="purple" flat :absolute="true" density="compact">
    <!-- :absolute="false" -->
    <v-toolbar-title> IIIF Georeference Viewer </v-toolbar-title>

    <v-spacer></v-spacer>

    <v-btn @click="dialog = true"> 地名一覧 </v-btn>

    <v-dialog v-model="dialog" :width="showTable ? `60vw` : `auto`">
      <v-card>
        <v-card-title class="bg-sub d-flex justify-space-between">
          <span class="flex-1-0 mr-4">地名一覧</span>
          <span class="">
            <v-btn color="black" variant="flat" class="mb-1" size="small" @click="showTable = !showTable">
              <v-icon>{{ showTable ? mdiChevronDown : mdiChevronUp }}</v-icon>
            </v-btn>
          </span>
        </v-card-title>

        <v-card-text v-if="showTable">
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
            height="40vh"
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
                <v-icon class="mr-1">{{ mdiImageFilterCenterFocus }}</v-icon> フォーカス
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>
