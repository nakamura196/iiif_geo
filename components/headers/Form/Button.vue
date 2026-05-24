<script setup lang="ts">
import { mdiPlusCircle } from "@mdi/js";

const dialog = ref(false);
</script>
<template>
  <DsButton variant="ghost" @click="dialog = !dialog">
    <DsIcon :path="mdiPlusCircle" size="1.25rem" />
    {{ $t("add") }}
  </DsButton>

  <DsDialog v-model="dialog" max-width="40rem">
    <HeadersForm />
    <div class="mt-6">
      <DsButton variant="primary" block @click="dialog = false">{{
        $t("close")
      }}</DsButton>
    </div>
  </DsDialog>
</template>
