<script setup lang="ts">
import { mdiInformation } from "@mdi/js";


const { locale } = useI18n();

interface ContentData extends Record<string, any> {}

const { data } = await useAsyncData<ContentData | null>(`help-${locale.value}`, async () => {
  const result = await queryCollection("docs").path(`/help/${locale.value}`).first();
  return result || {};
});

const dialog = ref(false);
</script>
<template>
  <DsButton variant="ghost" @click="dialog = !dialog">
    <DsIcon :path="mdiInformation" size="1.25rem" />
    {{ $t("help") }}
  </DsButton>

  <DsDialog v-model="dialog" max-width="48rem">
    <ContentRenderer v-if="data" class="nuxt-content" :value="data" />
    <div class="mt-6">
      <DsButton variant="primary" block @click="dialog = false">{{
        $t("close")
      }}</DsButton>
    </div>
  </DsDialog>
</template>
