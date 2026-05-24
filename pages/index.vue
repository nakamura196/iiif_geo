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
  <div class="flex h-screen flex-col">
    <Headers />
    <main class="relative min-h-0 flex-1">
      <template v-if="ready">
        <PanesMain />
      </template>
      <template v-else>
        <HeadersForm />
      </template>

      <div
        v-if="snackbar"
        class="fixed bottom-4 left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-3 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
      >
        <span>URLが不正です。</span>
        <button
          type="button"
          class="font-medium underline"
          @click="snackbar = false"
        >
          Close
        </button>
      </div>
    </main>
  </div>
</template>
