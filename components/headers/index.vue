<script setup lang="ts">
import { mdiGithub, mdiHome } from "@mdi/js";

const { canvases, title } = useSettings();

const url = ref("");

onMounted(() => {
  url.value = window.location.href;
});

const localePath = useLocalePath();

const drawer = ref(false);
</script>
<template>
  <v-app-bar color="purple" flat :absolute="true" density="compact">
    <template v-if="!$vuetify.display.mdAndUp">
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
    </template>

    <v-toolbar-title>
      {{ title || "IIIF Georeference Viewer" }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <template v-if="$vuetify.display.mdAndUp">
      <template v-if="canvases.length > 0">
        <HeadersSearch></HeadersSearch>
        <HeadersLicense></HeadersLicense>
        <HeadersFormButton></HeadersFormButton>
      </template>

      <template
        v-if="url.indexOf('github.io') > -1 || url.indexOf('localhost') > -1"
      >
        <v-btn
          variant="text"
          target="_blank"
          href="https://github.com/nakamura196/iiif_geo"
          class="ma-1"
        >
          <v-icon class="mr-1">{{ mdiGithub }}</v-icon>
          GitHub</v-btn
        >
      </template>

      <v-btn :active="false" :to="localePath({ name: 'index' })" class="ma-1">
        <v-icon class="mr-1">{{ mdiHome }}</v-icon>
        {{ $t("home") }}</v-btn
      >

      <HeadersHelp></HeadersHelp>

      <HeadersLanguage></HeadersLanguage>
    </template>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :location="$vuetify.display.mobile ? 'bottom' : undefined"
    temporary
  >
    <v-list>
      <template v-if="canvases.length > 0">
        <v-list-item>
          <HeadersSearch></HeadersSearch>
        </v-list-item>
        <v-list-item>
          <HeadersLicense></HeadersLicense>
        </v-list-item>
        <v-list-item>
          <HeadersFormButton></HeadersFormButton>
        </v-list-item>
      </template>
      <template
        v-if="url.indexOf('github.io') > -1 || url.indexOf('localhost') > -1"
      >
        <v-list-item>
          <v-btn
            variant="text"
            target="_blank"
            href="https://github.com/nakamura196/iiif_geo"
            class="ma-1"
          >
            <v-icon class="mr-1">{{ mdiGithub }}</v-icon>
            GitHub</v-btn
          >
        </v-list-item>
      </template>
      <v-list-item>
        <HeadersHelp></HeadersHelp>
      </v-list-item>
      <v-list-item>
        <HeadersLanguage></HeadersLanguage>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
