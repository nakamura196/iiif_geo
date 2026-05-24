// Small helper for the repeated `locale === "en" ? x.en : x.ja` pattern used by
// components that hold their own bilingual `{ ja, en }` data (landing page,
// add dialog) rather than i18n message keys.
export function useTr() {
  const { locale } = useI18n();
  const isEn = computed(() => locale.value === "en");
  const tr = (pair: { ja: string; en: string }) =>
    isEn.value ? pair.en : pair.ja;
  return { isEn, tr };
}
