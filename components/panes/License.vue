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
  <v-container>
    <h2>{{ $t("rights") }}</h2>

    <template v-if="manifest.requiredStatement">
      <h3>{{ requiredStatementLabel }}</h3>
      <div
        v-for="(value, index) in requiredStatementValues"
        :key="index"
        v-html="value"
      ></div>
    </template>

    <template v-if="manifest.rights">
      <h3>{{ $t("license") }}</h3>
      <div>
        <a :href="manifest.rights" target="_blank">
          {{ manifest.rights }}
        </a>
      </div>
    </template>
  </v-container>
</template>
