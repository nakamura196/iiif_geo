<script setup lang="ts">
import { mdiMagnify } from "@mdi/js";

const { settings } = usePanes();

const dialog = ref(false);

watch(
  () => dialog.value,
  () => {
    if (dialog.value) {
      const panes = settings.value.panes;
      panes.push({
        size: 30,
        items: [
          {
            id: "3-0",
            componentKey: "Table",
            size: 100,
          },
        ],
      });
    } else {
      const panes = settings.value.panes;
      panes.pop();
    }
  }
);
</script>

<template>
  <v-btn @click="dialog = !dialog">
    <v-icon class="mr-1">{{ mdiMagnify }}</v-icon
    >{{ $t("search") }}</v-btn
  >
</template>
