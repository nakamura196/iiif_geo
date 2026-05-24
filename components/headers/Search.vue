<script setup lang="ts">
import { mdiFormatListBulleted } from "@mdi/js";

const { togglePane, restorePaneFromQuery } = usePanes();

onMounted(() => restorePaneFromQuery("search"));
</script>

<template>
  <DsButton
    variant="secondary"
    class="mx-1 !rounded-full"
    @click="togglePane('search')"
  >
    <DsIcon :path="mdiFormatListBulleted" size="1.25rem" />{{ $t("list") }}</DsButton
  >
</template>
