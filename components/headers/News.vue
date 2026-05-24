<script setup lang="ts">
// Menu trigger only — the dialog itself lives in NewsDialog.vue (mounted once,
// always available) so it can also be opened from the landing-page pill.
import { mdiBullhorn } from "@mdi/js";

const { hasUnread, open } = useNews();
</script>
<template>
  <DsButton variant="ghost" @click="open">
    <DsIcon :path="mdiBullhorn" size="1.25rem" />
    {{ $t("news") }}
    <span
      v-if="hasUnread"
      class="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-accent-foreground"
    >
      New
    </span>
  </DsButton>
</template>
