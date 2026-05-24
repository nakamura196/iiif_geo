<script setup lang="ts">
const u = ref("");

const baseURL = useRuntimeConfig().public.appURL; // useNuxtApp().$config.app.baseURL;

const localePath = useLocalePath();

const add = () => {
  const router = useRouter();
  router.push(
    localePath({
      name: "index",
      query: { u: u.value },
    })
  );
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
  <div class="ds-container py-2">
    <DsInput
      v-model="u"
      :label="/*('canvas_url')*/ 'Canvas URL'"
      class="mt-2 mb-4"
    />

    <div class="flex flex-wrap gap-2">
      <DsButton variant="primary" @click="add">{{ $t("add") }}</DsButton>

      <DsButton
        v-for="(ex, i) in examples"
        :key="i"
        variant="secondary"
        @click="u = ex.value"
        >{{
          `${$t("ex")} ${i + 1}: ${ex.label[locale === "en" ? "en" : "ja"]}`
        }}</DsButton
      >
    </div>
  </div>
</template>
