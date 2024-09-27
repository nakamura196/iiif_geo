<script setup lang="ts">
import { mdiLicense } from "@mdi/js";

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
            id: "4-0",
            componentKey: "PanesLicense",
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
