import tailwindcss from "@tailwindcss/vite";
import { headConfig } from "./meta.config";

const baseURL = process.env.NUXT_PUBLIC_BASE_URL || "";

const origin = process.env.NUXT_PUBLIC_ORIGIN || "";
const appURL = origin + baseURL;

let defaultLocale;
if (headConfig.lang === "en") {
  defaultLocale = "en" as const
} else {
  defaultLocale = "ja" as const
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    // footer: process.env.footer,
    public: {
      appURL,
    },
  },

  modules: ["@nuxt/content", "@nuxtjs/i18n"],

  typescript: {
    // 開発サーバーでのインライン型チェックは無効化（vue-tsc/Volar のプラグイン
    // 不整合で起動時に "plugin is not a function" が出るため）。
    // 型チェックは IDE(Volar) と CI/コミット前の `pnpm nuxt typecheck` で行う。
    typeCheck: false,
    strict: true,
  },

  i18n: {
    locales: [
      { code: "ja", language: "ja", file: "ja.js" },
      { code: "en", language: "en", file: "en.js" },
    ],
    langDir: "locales/",
    defaultLocale,
    lazy: true,
    bundle: {
      optimizeTranslationDirective: false
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root", // recommended
    },
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: {
        lang: headConfig.lang,
      },
      title: headConfig.siteName,
      meta: [
        { charset: "utf-8" },
        { "http-equiv": "x-ua-compatible", content: "ie=edge" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "format-detection",
          content: "telephone=no, email=no, address=no",
        },
        // SEO関連
        { name: "description", content: headConfig.description },
        { name: "keywords", content: headConfig.keywords },
        // ogp関連
        {
          property: "og:site_name",
          content: headConfig.siteName,
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: appURL },
        { property: "og:title", content: headConfig.siteName },
        {
          property: "og:description",
          content: headConfig.description,
        },
        {
          property: "og:image",
          content: `${appURL}${headConfig.image}`,
        },
        { property: "og:image:type", content: headConfig.imageType },
        {
          property: "og:image:width",
          content: String(headConfig.imageWidth),
        },
        {
          property: "og:image:height",
          content: String(headConfig.imageHeight),
        },
        { property: "og:image:alt", content: headConfig.siteName },
        // og:locale + htmlAttrs.lang are set per active locale in app.vue.
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: headConfig.siteName },
        { name: "twitter:description", content: headConfig.description },
        {
          name: "twitter:image",
          content: `${appURL}${headConfig.image}`,
        },
      ],
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: `${baseURL}/favicon.svg?v=${headConfig.faviconVersion}`,
        },
        {
          rel: "alternate icon",
          type: "image/x-icon",
          href: `${baseURL}${headConfig.favicon}?v=${headConfig.faviconVersion}`,
        },
        // Fonts for hi-design-system (Inter + Noto Sans JP)
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },

  css: ["@/assets/styles/main.css"],

  components: {
    global: true,
    dirs: ["~/components"],
  },

  build: {
    // hi-design-system ships raw .vue SFCs under its `vue` subpath — transpile
    // so Nuxt/Vite compiles them when consumed from node_modules.
    transpile: ["hi-design-system"],
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // 実行時に発見される CJS/大型依存を事前バンドルし、初回ロードの再最適化リロードを防ぐ
      include: ["@mdi/js", "openseadragon", "splitpanes", "maplibre-gl"],
    },
  },

  compatibilityDate: "2024-09-26",
});
