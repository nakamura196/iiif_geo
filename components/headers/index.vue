<script setup lang="ts">
import { mdiClose, mdiHome, mdiMenu } from "@mdi/js";
import { useResponsive } from "~/composables/useResponsive";

const { canvases, title } = useSettings();

const url = ref("");

onMounted(() => {
  url.value = window.location.href;
});

const localePath = useLocalePath();

const drawer = ref(false);

const { hasUnread } = useNews();

const { mobile, mdAndUp } = useResponsive();
</script>
<template>
  <header
    class="flex h-12 flex-none items-center gap-1 bg-primary px-2 text-primary-foreground"
  >
    <span class="truncate font-medium text-primary-foreground">
      {{ title || "IIIF Georeference Viewer" }}
    </span>

    <span class="flex-1"></span>

    <!-- Always show Search and License in header, regardless of screen size -->
    <template v-if="canvases.length > 0">
      <HeadersSearch></HeadersSearch>
      <div @click="drawer = false">
        <HeadersLicense
          class="!text-primary-foreground hover:!bg-primary-hover"
        ></HeadersLicense>
      </div>
    </template>

    <!-- Always show hamburger menu for other items -->
    <div class="relative">
      <DsIconButton
        :icon="mdiMenu"
        variant="ghost"
        :label="$t('menu')"
        class="!text-primary-foreground hover:!bg-primary-hover"
        @click.stop="drawer = !drawer"
      />
      <!-- Unread-news indicator: a small accent dot, ringed in the header color
           so it stays legible against the brown header. -->
      <span
        v-if="hasUnread"
        class="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-primary"
      ></span>
    </div>
  </header>

  <Teleport to="body">
    <div
      v-if="drawer"
      class="fixed inset-0 z-[var(--z-drawer-scrim)] bg-black/40"
      @click="drawer = false"
    ></div>
    <nav
      v-if="drawer"
      class="ds-drawer fixed z-[var(--z-drawer)] flex flex-col bg-surface shadow-xl"
      :class="
        mobile
          ? 'inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl'
          : 'right-0 top-0 h-full w-72 overflow-y-auto border-l border-border'
      "
    >
      <!-- Grab handle (mobile bottom sheet) -->
      <div v-if="mobile" class="flex justify-center pt-2.5">
        <span class="h-1 w-9 rounded-full bg-border-strong"></span>
      </div>

      <!-- Drawer header -->
      <div
        class="flex items-center justify-between border-b border-border px-2 py-2"
      >
        <span
          class="px-1 text-xs font-semibold uppercase tracking-wider text-foreground-subtle"
        >
          {{ $t("menu") }}
        </span>
        <DsIconButton
          :icon="mdiClose"
          variant="ghost"
          size="sm"
          :label="$t('close')"
          @click="drawer = false"
        />
      </div>

      <div class="ds-drawer-list flex flex-col gap-0.5 p-2">
        <!-- Only show JsonViewer and FormButton if canvases exist (Search and License are in header) -->
        <template v-if="canvases.length > 0">
          <HeadersJsonViewer></HeadersJsonViewer>
          <HeadersFormButton></HeadersFormButton>
          <hr class="my-1.5 border-border" />
        </template>

        <DsButton
          variant="ghost"
          :to="localePath({ name: 'index' })"
          @click="drawer = false"
        >
          <DsIcon :path="mdiHome" size="1.25rem" />
          {{ $t("home") }}
        </DsButton>

        <HeadersNews></HeadersNews>
        <HeadersGitHub></HeadersGitHub>
        <HeadersHelp></HeadersHelp>

        <hr class="my-1.5 border-border" />
        <HeadersLanguage></HeadersLanguage>
      </div>
    </nav>
  </Teleport>

  <!-- Mounted once, always available: opened from the menu item and the
       landing-page pill via the shared state in useNews(). -->
  <HeadersNewsDialog />
</template>

<style scoped>
/* Render the drawer's action buttons as left-aligned, full-width list rows.
   The `ds-btn` recipe centres its content, which reads as a toolbar — wrong for
   a vertical nav.

   `:not(dialog *)` is essential: the menu items (JsonViewer/Add/Help) own
   <dialog> elements that, while shown in the top layer, are DOM descendants of
   this list. Without the guard this rule would leak into those dialogs and
   stretch their close/footer buttons to full width. */
.ds-drawer-list :deep(.ds-btn:not(dialog *)) {
  width: 100%;
  justify-content: flex-start;
}
</style>
