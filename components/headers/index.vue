<script setup lang="ts">
import { mdiHome } from "@mdi/js";
import { useDisplay } from "vuetify";

const { canvases, title } = useSettings();

const url = ref("");

onMounted(() => {
  url.value = window.location.href;
});

const localePath = useLocalePath();

const drawer = ref(false);

const { mobile, mdAndUp } = useDisplay();
</script>
<template>
  <v-app-bar color="purple" flat :absolute="true" density="compact">
    <v-toolbar-title>
      {{ title || "IIIF Georeference Viewer" }}
    </v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- Always show Search and License in header, regardless of screen size -->
    <template v-if="canvases.length > 0">
      <HeadersSearch></HeadersSearch>
      <HeadersLicense></HeadersLicense>
    </template>

    <!-- Always show hamburger menu for other items -->
    <v-app-bar-nav-icon
      variant="text"
      @click.stop="drawer = !drawer"
    ></v-app-bar-nav-icon>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :location="mobile ? 'bottom' : undefined"
    temporary
  >
    <v-list>
      <!-- Only show JsonViewer and FormButton if canvases exist (Search and License are in header) -->
      <template v-if="canvases.length > 0">
        <v-list-item>
          <HeadersJsonViewer></HeadersJsonViewer>
        </v-list-item>
        <v-list-item>
          <HeadersFormButton></HeadersFormButton>
        </v-list-item>
      </template>

      <v-list-item>
        <v-btn :active="false" :to="localePath({ name: 'index' })" variant="text" class="ma-1">
          <v-icon class="mr-1">{{ mdiHome }}</v-icon>
          {{ $t("home") }}
        </v-btn>
      </v-list-item>
      
      <v-list-item>
        <HeadersGitHub></HeadersGitHub>
      </v-list-item>
      <v-list-item>
        <HeadersHelp></HeadersHelp>
      </v-list-item>
      <v-list-item>
        <HeadersLanguage></HeadersLanguage>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
