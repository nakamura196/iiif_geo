<script setup lang="ts">
import { mdiLicense } from "@mdi/js";

const { togglePane, restorePaneFromQuery } = usePanes();

onMounted(() => restorePaneFromQuery("license"));
</script>

<template>
  <DsButton variant="ghost" class="mx-1" @click="togglePane('license')">
    <DsIcon :path="mdiLicense" size="1.25rem" />
    {{ $t("rights") }}</DsButton
  >
</template>
