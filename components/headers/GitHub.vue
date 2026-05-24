<script setup lang="ts">
import { mdiGithub } from "@mdi/js";
</script>
<template>
  <DsButton
    variant="ghost"
    target="_blank"
    href="https://github.com/nakamura196/iiif_geo"
  >
    <DsIcon :path="mdiGithub" size="1.25rem" />
    GitHub
  </DsButton>
</template>
