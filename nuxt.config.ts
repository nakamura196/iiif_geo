// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }
      ]
    },
  },

  css: ["leaflet/dist/leaflet.css", "leaflet.markercluster/dist/MarkerCluster.Default.css", "vuetify/lib/styles/main.sass"],

  build: {
    transpile: ["vuetify", /^@vue-leaflet.*$/],
  },

  vite: {
    define: {
      "process.env.DEBUG": false,
    },
    server: {
      hmr: {
        port: 3001,
      },
    },
  },

  modules: ["@nuxt/content", "@nuxtjs/i18n", "@nuxt/image", "@nuxt/test-utils/module"],

  runtimeConfig: {
    public: {
      manifest: 'https://iiif.dl.itc.u-tokyo.ac.jp/repo/iiif/kurosiwo/manifest.json'
    }
  },

  i18n: {
    vueI18n: "./i18n.config.ts",
    locales: [
      {
        code: 'en',
        name: 'English'
      },
      {
        code: 'ja',
        name: '日本語'
      }
    ],
    defaultLocale: 'ja',
    strategy: 'prefix_except_default'
  },

  compatibilityDate: "2025-01-09",
})