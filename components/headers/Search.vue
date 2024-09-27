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
            componentKey: "PanesSearch",
            size: 100,
          },
        ],
        id: "search",
      });
    } else {
      const panes = settings.value.panes;
      // panes.pop();

      const index = panes.findIndex((pane) => pane.id === "search");
      if (index > -1) {
        panes.splice(index, 1);
      }
    }
  }
);

onMounted(() => {
  const route = useRoute();
  if (route.query.search === "1") {
    dialog.value = true;
  }
});
</script>

<template>
  <v-btn
    class="mx-1"
    rounded
    color="error"
    variant="flat"
    @click="dialog = !dialog"
  >
    <v-icon class="mr-1">{{ mdiMagnify }}</v-icon
    >{{ $t("search") }}</v-btn
  >
</template>
