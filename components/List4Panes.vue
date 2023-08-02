<script setup lang="ts">
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
  <span>
    <v-btn @click="dialog = !dialog"> 地名一覧</v-btn>
  </span>
</template>
