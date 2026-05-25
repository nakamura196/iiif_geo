<script setup lang="ts">
// Always-mounted privacy policy dialog (opened from the menu item and the
// landing-page footer link via the shared state in usePrivacy()). Content is
// locale-specific markdown under content/privacy/{locale}.md; `watch: [locale]`
// refetches on language switch since this component outlives the drawer.
import { mdiShieldLockOutline } from "@mdi/js";

const { locale } = useI18n();
const { isOpen } = usePrivacy();

interface ContentData extends Record<string, any> {}

// Locale-scoped key (like Help.vue) so prerendering `/` and `/ja` don't share
// one payload entry. `watch: [locale]` refetches on client-side language switch,
// since this dialog is mounted once and outlives the drawer.
const { data } = await useAsyncData<ContentData | null>(
  `privacy-${locale.value}`,
  async () => {
    const result = await queryCollection("docs")
      .path(`/privacy/${locale.value}`)
      .first();
    return result || {};
  },
  { watch: [locale] }
);
</script>
<template>
  <DsDialog v-model="isOpen" max-width="48rem">
    <!-- Header -->
    <DsDialogHeader
      :icon="mdiShieldLockOutline"
      :title="$t('privacy')"
      :close-label="$t('close')"
      @close="isOpen = false"
    />

    <!-- Body. Markdown styling is global (`.nuxt-content` in main.css). -->
    <div class="nuxt-content mt-3 max-h-[65vh] overflow-y-auto pr-1">
      <ContentRenderer v-if="data" :value="data" />
    </div>

    <div class="mt-6">
      <DsButton variant="primary" block @click="isOpen = false">{{
        $t("close")
      }}</DsButton>
    </div>
  </DsDialog>
</template>
