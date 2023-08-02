<script setup lang="ts">
const { canvas } = useSettings();
</script>
<template>
  <v-app-bar color="purple" flat :absolute="true" density="compact">
    <v-toolbar-title> IIIF Georeference Viewer </v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- <List v-if="canvas && Object.keys(canvas).length > 0"></List> -->

    <List4Panes v-if="canvas && Object.keys(canvas).length > 0"></List4Panes>
  </v-app-bar>
</template>
