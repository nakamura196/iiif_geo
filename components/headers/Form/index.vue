<script setup lang="ts">
import { mdiMapMarker, mdiImage, mdiLayers, mdiArrowRight, mdiOpenInNew } from "@mdi/js";

const u = ref("");

const baseURL = useRuntimeConfig().public.appURL;

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
    description: {
      ja: "メタデータとラベルを含む完全な例",
      en: "Full example with metadata and labels",
    },
    value: baseURL + "/canvas_extra.json",
  },
  {
    label: {
      ja: "シンプルな例",
      en: "Simple example",
    },
    description: {
      ja: "基本的なジオリファレンス設定",
      en: "Basic georeference setup",
    },
    value: baseURL + "/canvas.json",
  },
  {
    label: {
      ja: "マニフェストの例",
      en: "Manifest example",
    },
    description: {
      ja: "IIIFマニフェスト形式の例",
      en: "IIIF manifest format example",
    },
    value: baseURL + "/manifest.json",
  },
];

const features = [
  {
    icon: mdiImage,
    title: {
      ja: "IIIF画像表示",
      en: "IIIF Image Viewer",
    },
    description: {
      ja: "高解像度画像をスムーズに閲覧",
      en: "Smooth viewing of high-resolution images",
    },
  },
  {
    icon: mdiMapMarker,
    title: {
      ja: "地理参照",
      en: "Georeference",
    },
    description: {
      ja: "画像を地図上に正確に配置",
      en: "Accurately place images on maps",
    },
  },
  {
    icon: mdiLayers,
    title: {
      ja: "オーバーレイ表示",
      en: "Overlay Display",
    },
    description: {
      ja: "複数のレイヤーを重ねて比較",
      en: "Compare multiple layers by overlaying",
    },
  },
];

const { locale } = useI18n();

const inputCard = ref<HTMLElement | null>(null);

const selectExample = (value: string) => {
  u.value = value;
  nextTick(() => {
    inputCard.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};
</script>
<template>
  <div class="h-full overflow-y-auto bg-surface">
    <!-- Hero -->
    <section class="bg-primary px-4 py-16 text-center text-primary-foreground">
      <h1 class="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
        IIIF Georeference Viewer
      </h1>
      <p class="mx-auto mb-8 max-w-xl text-base opacity-90 sm:text-lg">
        {{
          locale === "en"
            ? "Visualize historical maps and images with geographic context"
            : "歴史的な地図や画像を地理的コンテキストで可視化"
        }}
      </p>

      <!-- Main input -->
      <div
        ref="inputCard"
        class="mx-auto flex max-w-2xl items-center gap-2 rounded-2xl bg-surface p-4 shadow-lg"
      >
        <DsInput
          v-model="u"
          class="flex-1"
          :label="locale === 'en' ? 'Enter Canvas URL' : 'Canvas URLを入力'"
          placeholder="https://example.com/canvas.json"
          @keyup.enter="add"
        />
        <DsButton variant="primary" :disabled="!u" @click="add">
          <DsIcon :path="mdiArrowRight" size="1.25rem" />
        </DsButton>
      </div>
    </section>

    <!-- Examples -->
    <section class="px-4 py-12">
      <h2 class="mb-8 text-center text-2xl font-semibold text-foreground">
        {{ locale === "en" ? "Try Examples" : "サンプルを試す" }}
      </h2>
      <div class="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="(ex, i) in examples"
          :key="i"
          class="flex flex-col rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-lg"
        >
          <span
            class="mb-3 inline-flex w-fit rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground"
          >
            {{ locale === "en" ? "Example" : "例" }} {{ i + 1 }}
          </span>
          <h3 class="mb-1 text-base font-semibold text-foreground">
            {{ ex.label[locale === "en" ? "en" : "ja"] }}
          </h3>
          <p class="mb-4 flex-1 text-sm text-foreground-muted">
            {{ ex.description[locale === "en" ? "en" : "ja"] }}
          </p>
          <div class="flex items-center gap-2">
            <DsButton
              variant="secondary"
              class="flex-1"
              @click="selectExample(ex.value)"
            >
              {{ locale === "en" ? "Load Example" : "読み込む" }}
            </DsButton>
            <a
              :href="ex.value"
              target="_blank"
              rel="noopener"
              :aria-label="locale === 'en' ? 'Open in new tab' : '新しいタブで開く'"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-muted"
            >
              <DsIcon :path="mdiOpenInNew" size="1.25rem" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-surface-muted px-4 py-12">
      <h2 class="mb-8 text-center text-2xl font-semibold text-foreground">
        {{ locale === "en" ? "Features" : "機能" }}
      </h2>
      <div class="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3">
        <div
          v-for="(feature, i) in features"
          :key="i"
          class="flex flex-col items-center p-6 text-center"
        >
          <div
            class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <DsIcon :path="feature.icon" size="2rem" />
          </div>
          <h3 class="mb-1 text-base font-semibold text-foreground">
            {{ feature.title[locale === "en" ? "en" : "ja"] }}
          </h3>
          <p class="text-sm text-foreground-muted">
            {{ feature.description[locale === "en" ? "en" : "ja"] }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
