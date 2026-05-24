<script setup lang="ts">
import { mdiMagnify } from "@mdi/js";

const { togglePane, restorePaneFromQuery } = usePanes();

onMounted(() => restorePaneFromQuery("search"));
</script>

<template>
  <DsButton
    variant="primary"
    class="mx-1 !rounded-full"
    @click="togglePane('search')"
  >
    <DsIcon :path="mdiMagnify" size="1.25rem" />{{ $t("list") }}</DsButton
  >
</template>
