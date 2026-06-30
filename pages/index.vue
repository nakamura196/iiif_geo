<script setup lang="ts">
import { useViewer } from "~/composables/useViewer";
import { normalizeManifestUrl } from "~/utils/manifestUrl";
const { ready, snackbar, display } = useViewer();
const route = useRoute();

// Reload the manifest only when the `u` query parameter changes.
//
// Watching `route.fullPath` (the previous behaviour) re-ran display() on every
// route change — including a language switch (`/?u=…` → `/ja?u=…`), where `u`
// is unchanged. That needlessly tore down and rebuilt the panes, desyncing the
// view restored from the URL (center / rotation / selected id). Keying on `u`
// keeps the language switch purely reactive (translations update in place) and
// leaves the viewer state untouched. See utils/manifestUrl.ts.
watch(
  () => normalizeManifestUrl(route.query.u as string | string[] | undefined),
  (url) => {
    display(url);
  },
  { immediate: true }
);
</script>
<template>
  <div class="flex h-screen flex-col">
    <Headers />
    <main class="relative min-h-0 flex-1">
      <template v-if="ready">
        <PanesMain />
      </template>
      <template v-else>
        <HeadersForm />
      </template>

      <div
        v-if="snackbar"
        class="fixed bottom-4 left-1/2 z-[var(--z-snackbar)] flex -translate-x-1/2 items-center gap-3 rounded-md bg-foreground px-4 py-2 text-sm text-background shadow-lg"
      >
        <span>{{ $t("invalidUrl") }}</span>
        <button
          type="button"
          class="font-medium underline"
          @click="snackbar = false"
        >
          {{ $t("close") }}
        </button>
      </div>
    </main>
  </div>
</template>
