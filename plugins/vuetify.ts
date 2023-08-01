import { createVuetify, ThemeDefinition } from "vuetify";
import { VDataTable, VDataTableVirtual } from 'vuetify/labs/VDataTable'
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import colors from "vuetify/lib/util/colors";

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';

const primary = colors.blue.base;
const error = colors.red.base;
// const teal = "#D50000" // "#80CBC4" // "#4DB6AC" // colors.teal.base;
const main = "#80CBC4"

const config: any  = {
  primary,
  error,
  main,
}

const light_color = Object.assign({}, config)
light_color.sub = "#EEEEEE"

const dark_color = Object.assign({}, config)
dark_color.sub = "#424242"

const customLightTheme: ThemeDefinition = {
  dark: false,
  colors: light_color
};

const customDarkTheme: ThemeDefinition = {
  dark: true,
  colors: dark_color
};

// components.VDataTable = VDataTable

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components: {
      ... components,
      VDataTable,
      VDataTableVirtual
    },
    directives,
    theme: {
      // defaultTheme: "customTheme",
      themes: {
        light: customLightTheme,
        dark: customDarkTheme,
      },
    },
    icons: {
      defaultSet: 'mdi',
       aliases,
       sets: {
           mdi,
       },
    }
  });

  nuxtApp.vueApp.use(vuetify);
});
