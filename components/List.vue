<script setup lang="ts">
import { mdiChevronUp, mdiChevronDown } from "@mdi/js";
const dialog = ref(false);

const showTable = ref(true);
</script>

<template>
  <span>
    <v-btn @click="dialog = true"> 地名一覧 </v-btn>

    <v-dialog v-model="dialog" :width="showTable ? `60vw` : `auto`">
      <v-card>
        <v-card-title class="bg-sub d-flex justify-space-between">
          <span class="flex-1-0 mr-4">地名一覧</span>
          <span class="">
            <v-btn
              color="black"
              variant="flat"
              class="mb-1"
              size="small"
              @click="showTable = !showTable"
            >
              <v-icon>{{ showTable ? mdiChevronDown : mdiChevronUp }}</v-icon>
            </v-btn>
          </span>
        </v-card-title>

        <v-card-text v-if="showTable">
          <Table :height="300"></Table>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>
