<script setup lang="ts">
import { mdiInformation } from "@mdi/js";

const { data } = await useAsyncData('home', () => queryContent('/help').findOne())

const dialog = ref(false);
</script>
<template>
  <v-btn @click="dialog = !dialog" class="ma-1">
    <v-icon class="mr-1">{{ mdiInformation }}</v-icon>
    {{ /*("add")*/ "ヘルプ" }}

    <v-dialog v-model="dialog">
      <v-card>
        <v-card-text>
          <ContentRenderer class="nuxt-content" :value="data" />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialog = false">閉じる</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-btn>
</template>
