<script setup lang="ts">
const u = ref("");

const baseURL = useRuntimeConfig().public.appURL; // useNuxtApp().$config.app.baseURL;

const add = () => {
  const router = useRouter();
  router.push({ query: { u: u.value } });
};

const examples = [
  {
    label: {
      ja: "ラベルを含む例",
      en: "Example with labels",
    },
    value: baseURL + "/canvas_extra.json",
  },
  {
    label: {
      ja: "シンプルな例",
      en: "Simple example",
    },
    value: baseURL + "/canvas.json",
  },
];

const { locale } = useI18n();
</script>
<template>
  <v-container>
    <v-text-field
      v-model="u"
      :label="/*('canvas_url')*/ 'Canvas URL'"
      single-line
      hide-details
      variant="outlined"
      density="compact"
      class="mt-2 mb-4"
      clearable
    ></v-text-field>

    <v-btn @click="add" class="ma-1" color="primary">{{ $t("add") }}</v-btn>

    <v-btn v-for="(ex, i) in examples" @click="u = ex.value" class="ma-1">{{
      `${$t("ex")} ${i + 1}: ${ex.label[locale === "en" ? "en" : "ja"]}`
    }}</v-btn>
  </v-container>
</template>
