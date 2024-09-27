<script setup lang="ts">
import { useDisplay } from "~/composables/useDisplay";
const { ready, snackbar, display } = useDisplay();
const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    display(route.query.u as string);
  },
  { immediate: true }
);
</script>
<template>
  <v-app>
    <Headers></Headers>

    <v-main>
      <template v-if="ready">
        <PanesMain></PanesMain>
      </template>
      <template v-else>
        <HeadersForm></HeadersForm>
      </template>

      <v-snackbar v-model="snackbar">
        {{ "URLが不正です。" }}

        <template v-slot:actions>
          <v-btn color="pink" variant="text" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>
