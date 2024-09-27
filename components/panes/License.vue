<script setup lang="ts">
const { manifest } = useSettings();
const manifestData = manifest.value;
</script>
<template>
  <v-container>
    <h2>{{ $t("rights") }}</h2>

    <template v-if="manifestData.requiredStatement">
      <h3>
        {{ manifestData.requiredStatement.label.none?.[0] }}
      </h3>
      <div
        v-for="value in manifestData.requiredStatement.value.none"
        v-html="value"
      ></div>
    </template>

    <template v-if="manifestData.rights">
      <h3>{{ $t("license") }}</h3>
      <div>
        <a :href="manifestData.rights" target="_blank">
          {{ manifestData.rights }}
        </a>
      </div>
    </template>
  </v-container>
</template>
