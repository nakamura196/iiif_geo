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
    typeCheck: true,
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
        {
          property: "og:locale",
          content: "ja_JP",
        },
        { name: "twitter:card", content: "summary" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: `${appURL}${headConfig.favicon}`,
        },
      ],
    },
  },

  css: ["@/assets/styles/vuetify.css", "@/assets/styles/main.css"],

  build: {
    transpile: ["vuetify"],
  },

  components: {
    global: true,
    dirs: ["~/components"],
  },

  compatibilityDate: "2024-09-26",
});
