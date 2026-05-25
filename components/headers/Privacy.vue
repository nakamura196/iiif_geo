<script setup lang="ts">
// Menu trigger only — the dialog itself lives in PrivacyDialog.vue (mounted
// once, always available) so it can also be opened from the landing-page footer.
import { mdiShieldLockOutline } from "@mdi/js";

const { open } = usePrivacy();
</script>
<template>
  <DsButton variant="ghost" @click="open">
    <DsIcon :path="mdiShieldLockOutline" size="1.25rem" />
    {{ $t("privacy") }}
  </DsButton>
</template>
