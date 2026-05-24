<script setup lang="ts">
const { manifest } = useSettings();
const { locale } = useI18n();

// 多言語対応のラベル取得
const getLocalizedValue = (obj: any): string[] => {
  if (!obj) return [];
  // 現在のロケールを優先
  if (obj[locale.value]) return obj[locale.value];
  // 'none'（言語非依存）
  if (obj.none) return obj.none;
  // 'en'フォールバック
  if (obj.en) return obj.en;
  // 最初に見つかったキー
  const keys = Object.keys(obj);
  const firstKey = keys[0];
  if (firstKey) return obj[firstKey];
  return [];
};

const requiredStatementLabel = computed(() => {
  return getLocalizedValue(manifest.value.requiredStatement?.label)?.[0] || '';
});

const requiredStatementValues = computed(() => {
  return getLocalizedValue(manifest.value.requiredStatement?.value) || [];
});
</script>
<template>
  <div class="ds-container py-4">
    <h2 class="text-lg font-semibold text-foreground">{{ $t("rights") }}</h2>

    <template v-if="manifest.requiredStatement">
      <h3 class="mt-4 text-sm font-semibold text-foreground-muted">
        {{ requiredStatementLabel }}
      </h3>
      <div
        v-for="(value, index) in requiredStatementValues"
        :key="index"
        class="mt-1 text-sm text-foreground"
        v-html="value"
      ></div>
    </template>

    <template v-if="manifest.rights">
      <h3 class="mt-4 text-sm font-semibold text-foreground-muted">
        {{ $t("license") }}
      </h3>
      <div class="mt-1">
        <a
          :href="manifest.rights"
          target="_blank"
          rel="noopener noreferrer"
          class="break-all text-sm text-link"
        >
          {{ manifest.rights }}
        </a>
      </div>
    </template>

    <p
      v-if="!manifest.requiredStatement && !manifest.rights"
      class="mt-2 text-sm text-foreground-subtle"
    >
      —
    </p>
  </div>
</template>
