/**
 * Registers the hi-design-system Vue components globally, so existing
 * <DsButton>, <DsCard>, <DsDialog>, … tags resolve app-wide. The app now
 * reuses the shared package (hi-design-system/vue) instead of local copies
 * under components/ds — the design system owns these components.
 */
import * as DS from "hi-design-system/vue";

export default defineNuxtPlugin((nuxtApp) => {
  for (const [name, component] of Object.entries(DS)) {
    nuxtApp.vueApp.component(name, component as any);
  }
});
