
const baseURL = process.env.NUXT_PUBLIC_BASE_URL || "";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/content",
  ],
  app: {
    baseURL
  },
  css: [
    "@/assets/styles/vuetify.css"
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
