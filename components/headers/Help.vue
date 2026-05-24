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

    <!-- Body -->
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

<style scoped>
/* Brand-styled markdown for the help content. The rendered root carries the
   `.nuxt-content` class (Nuxt Content's ContentRenderer); style its
   descendants with design tokens — no hard-coded colors. */
.nuxt-content :deep(h1) {
  /* The dialog header already says "Help" — hide the duplicate page title. */
  display: none;
}
.nuxt-content :deep(h2) {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-foreground);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--color-border);
}
.nuxt-content :deep(h3) {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-foreground);
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}
/* Nuxt Content wraps heading text in anchor links; keep them on heading color. */
.nuxt-content :deep(h2 a),
.nuxt-content :deep(h3 a) {
  color: inherit;
  text-decoration: none;
}
/* Literal <b> in the markdown is used as a pseudo-subheading. */
.nuxt-content :deep(b) {
  display: inline-block;
  font-weight: 600;
  color: var(--color-primary);
  margin-top: 0.75rem;
}
.nuxt-content :deep(strong) {
  font-weight: 600;
  color: var(--color-foreground);
}
.nuxt-content :deep(p) {
  line-height: var(--leading-relaxed);
  color: var(--color-foreground-muted);
  margin-bottom: 0.75rem;
}
.nuxt-content :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
  color: var(--color-foreground-muted);
}
.nuxt-content :deep(li) {
  line-height: var(--leading-relaxed);
  margin-bottom: 0.25rem;
}
.nuxt-content :deep(ul ul) {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}
.nuxt-content :deep(a) {
  color: var(--color-link);
}
.nuxt-content :deep(code) {
  background-color: var(--color-surface-muted);
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 0.85em;
  color: var(--color-primary);
}
.nuxt-content :deep(pre) {
  background-color: var(--color-neutral-900);
  color: var(--color-neutral-50);
  padding: 1rem;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 1rem 0;
  font-size: var(--text-sm);
  line-height: 1.6;
}
.nuxt-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}
</style>
