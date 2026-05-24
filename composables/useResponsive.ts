// composables/useResponsive.ts
//
// Drop-in replacement for Vuetify's `useDisplay()` (the `mobile` / `mdAndUp`
// parts we relied on) so we can remove the Vuetify dependency. Breakpoint is
// 960px to roughly match Vuetify 3's `md` threshold.
//
// SSR-safe: width defaults to a desktop value on the server and corrects on
// mount. Components that read these inside onMounted/map-init are unaffected.
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const MD_BREAKPOINT = 960;

export function useResponsive() {
  const width = ref(import.meta.client ? window.innerWidth : 1280);

  const update = () => {
    width.value = window.innerWidth;
  };

  onMounted(() => {
    update();
    window.addEventListener("resize", update, { passive: true });
  });

  onBeforeUnmount(() => {
    if (import.meta.client) window.removeEventListener("resize", update);
  });

  const mdAndUp = computed(() => width.value >= MD_BREAKPOINT);
  const mobile = computed(() => width.value < MD_BREAKPOINT);

  return { mobile, mdAndUp, width };
}
