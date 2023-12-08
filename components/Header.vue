<script setup lang="ts">
import { mdiGithub, mdiHome } from "@mdi/js";

const { canvas, title } = useSettings();

const url = ref("")

onMounted(() => {
  url.value = window.location.href;
});
</script>
<template>
  <v-app-bar color="purple" flat :absolute="true" density="compact">
    <v-toolbar-title>
      {{ title || "IIIF Georeference Viewer" }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <v-btn :active="false" to="/" class="ma-1">
      <v-icon class="mr-1">{{ mdiHome }}</v-icon>
      HOME</v-btn
    >

    <template v-if="canvas.items && Object.keys(canvas.items).length > 0">
      <List4Panes></List4Panes>
      <InputButton></InputButton>
    </template>

    <Help></Help>

    <template
      v-if="url.indexOf('github.io') > -1 || url.indexOf('localhost') > -1"
    >
      <v-btn
        :active="false"
        href="https://github.com/nakamura196/iiif_geo"
        class="ma-1"
      >
        <v-icon class="mr-1">{{ mdiGithub }}</v-icon>
        GitHub</v-btn
      >
    </template>
  </v-app-bar>
</template>
