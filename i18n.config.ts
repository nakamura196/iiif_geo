export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'en',
  messages: {
    en: {
      // メッセージは別途i18n/locales/en.jsで管理
    },
    ja: {
      // メッセージは別途i18n/locales/ja.jsで管理
    }
  }
}))