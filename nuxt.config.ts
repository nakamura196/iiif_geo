// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL: "/iiif_geo",
  },
  css: [
    "@/assets/styles/vuetify.css",
  ],
  build: {
    transpile: [
      "vuetify"
    ],
  },
});
