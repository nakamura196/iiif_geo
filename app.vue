<script setup lang="ts">
// Keep <html lang> and og:locale in sync with the active i18n locale so each
// prerendered route (/, /ja) advertises the correct language.
const { locale } = useI18n();
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  meta: [
    {
      key: "og:locale",
      property: "og:locale",
      content: locale.value === "ja" ? "ja_JP" : "en_US",
    },
  ],
}));
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
</template>
