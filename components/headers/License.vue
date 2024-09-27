<script setup lang="ts">
import { mdiLicense } from "@mdi/js";

const { settings } = usePanes();

const dialog = ref(false);

watch(
  () => dialog.value,
  () => {
    const panes = settings.value.panes;
    const index = panes.findIndex((pane) => pane.id === "license");

    if (dialog.value) {

      

      if (index !== -1) {
        return;
      }

      panes.push({
        size: 30,
        items: [
          {
            id: "4-0",
            componentKey: "PanesLicense",
            size: 100,
          },
        ],
        id: "license",
      });
    } else {

      if (index > -1) {
        panes.splice(index, 1);
      }
    }
  }
);

onMounted(() => {
  const route = useRoute();
  if (route.query.license === "1") {
    dialog.value = true;
  }
});
</script>

<template>
  <v-btn class="mx-1" variant="text" @click="dialog = !dialog">
    <v-icon class="mr-1">{{ mdiLicense }}</v-icon>
    {{ $t("rights") }}</v-btn
  >
</template>
