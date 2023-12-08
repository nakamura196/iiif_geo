import { createVuetify } from "vuetify";
import type {ThemeDefinition} from "vuetify";
// import { VDataTable, VDataTableVirtual } from 'vuetify/labs/VDataTable'
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
// @ts-ignore
import colors from "vuetify/lib/util/colors";

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';

const primary = colors.blue.base;
const error = colors.red.base;
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
      ... components
    },
    directives,
    theme: {
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
