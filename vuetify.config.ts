import { defineVuetifyConfiguration } from "vuetify-nuxt-module/custom-configuration";

export default defineVuetifyConfiguration({
  theme: {
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#9C27B0",
          error: "#F44336",
          main: "#80CBC4",
          sub: "#EEEEEE",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#9C27B0",
          error: "#F44336",
          main: "#80CBC4",
          sub: "#424242",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi-svg",
  },
});
