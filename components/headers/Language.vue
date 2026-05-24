<script setup lang="ts">
import { mdiTranslate } from "@mdi/js";

const i18n = useI18n();

const options = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
] as const;

const changeLocale = (locale: "ja" | "en") => {
  i18n.setLocale(locale);
};
</script>
<template>
  <client-only>
    <div class="flex items-center gap-2 px-2 py-1.5">
      <DsIcon
        :path="mdiTranslate"
        size="1.25rem"
        class="shrink-0 text-foreground-muted"
      />
      <div class="flex flex-1 gap-0.5 rounded-md bg-surface-muted p-0.5">
        <button
          v-for="opt in options"
          :key="opt.code"
          type="button"
          class="flex-1 rounded px-2 py-1 text-sm transition-colors"
          :class="
            $i18n.locale === opt.code
              ? 'bg-surface font-medium text-foreground shadow-xs'
              : 'text-foreground-muted hover:text-foreground'
          "
          @click="changeLocale(opt.code)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>
  </client-only>
</template>
