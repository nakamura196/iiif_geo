
const baseURL = process.env.NUXT_PUBLIC_BASE_URL || "";
// const origin = process.env.ORIGIN || "";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  app: {
    baseURL // : "/iiif_geo",
  },
  css: [
    "@/assets/styles/vuetify.css",
  ],
  build: {
    transpile: [
      "vuetify"
    ],
  },
  components: {
    global: true,
    dirs: ["~/components"],
  },
});
