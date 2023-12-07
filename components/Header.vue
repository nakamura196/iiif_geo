<script setup lang="ts">
const { canvas, title } = useSettings();
</script>
<template>
  <v-app-bar color="purple" flat :absolute="true" density="compact">
    <v-toolbar-title>
      {{ title || "IIIF Georeference Viewer" }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <template v-if="canvas.items && Object.keys(canvas.items).length > 0">
      <List4Panes></List4Panes>
      <InputButton></InputButton>
    </template>

    <Help></Help>
  </v-app-bar>
</template>
