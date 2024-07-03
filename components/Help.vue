<script setup lang="ts">
import { mdiInformation } from "@mdi/js";

const { locale } = useI18n();

interface ContentData extends Record<string, any> {}

const { data } = await useAsyncData<ContentData | null>("home", () =>
  queryContent(`/help/${locale.value}`).findOne()
);

const dialog = ref(false);
</script>
<template>
  <v-btn @click="dialog = !dialog" class="ma-1">
    <v-icon class="mr-1">{{ mdiInformation }}</v-icon>
    {{ /*("add")*/ $t("help") }}

    <v-dialog v-model="dialog">
      <v-card>
        <v-card-text>
          <ContentRenderer class="nuxt-content" :value="data" />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialog = false">{{
            $t("close")
          }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-btn>
</template>
