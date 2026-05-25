// Shared open-state for the privacy policy dialog, so the menu item
// (HeadersPrivacy) and the landing-page footer link both drive the one
// always-mounted PrivacyDialog. Mirrors the News dialog pattern in useNews().
const isOpen = ref(false);

export function usePrivacy() {
  const open = () => {
    isOpen.value = true;
  };
  return { isOpen, open };
}
