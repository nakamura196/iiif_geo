<script setup lang="ts">
import { mdiHelpCircle } from "@mdi/js";

const { locale } = useI18n();

interface ContentData extends Record<string, any> {}

const { data } = await useAsyncData<ContentData | null>(
  `help-${locale.value}`,
  async () => {
    const result = await queryCollection("docs")
      .path(`/help/${locale.value}`)
      .first();
    return result || {};
  }
);

const dialog = ref(false);
</script>
<template>
  <DsButton variant="ghost" @click="dialog = !dialog">
    <DsIcon :path="mdiHelpCircle" size="1.25rem" />
    {{ $t("help") }}
  </DsButton>

  <DsDialog v-model="dialog" max-width="48rem">
    <!-- Header -->
    <DsDialogHeader
      :icon="mdiHelpCircle"
      :title="$t('help')"
      :close-label="$t('close')"
      @close="dialog = false"
    />

    <!-- Body. Markdown styling lives globally in main.css (`.nuxt-content`),
         shared with the Privacy dialog. -->
    <div class="nuxt-content mt-3 max-h-[65vh] overflow-y-auto pr-1">
      <ContentRenderer v-if="data" :value="data" />
    </div>

    <div class="mt-6">
      <DsButton variant="primary" block @click="dialog = false">{{
        $t("close")
      }}</DsButton>
    </div>
  </DsDialog>
</template>
