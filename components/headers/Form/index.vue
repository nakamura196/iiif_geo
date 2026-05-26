<script setup lang="ts">
import {
  mdiMapMarker,
  mdiImage,
  mdiLayers,
  mdiArrowRight,
  mdiOpenInNew,
  mdiLinkVariant,
  mdiGithub,
  mdiShieldLockOutline,
} from "@mdi/js";

const u = ref("");

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

const examples = useIiifExamples();

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

const { isEn, tr } = useTr();
const { newsEntries, hasUnread } = useNews();
const { open: openPrivacy } = usePrivacy();

// Intro video — swap between the Japanese and English narration uploads so the
// embed always matches the current UI locale. `:key` on the iframe forces a
// reload when the locale (and thus the id) changes.
const videoId = computed(() => (isEn.value ? "RoE5Mm6vSFE" : "3qsZbPXC9qg"));

const inputCard = ref<HTMLElement | null>(null);

const selectExample = (value: string) => {
  u.value = value;
  nextTick(() => {
    inputCard.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

// A whisper of 青海波 (seigaiha) wave behind the hero. The shared
// `ds-texture-wave` token draws in brand brown — invisible on the brown hero —
// so we paint a light-stroked variant here instead.
const heroWave = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='%23ffffff' stroke-width='1'><circle cx='20' cy='20' r='20'/><circle cx='20' cy='20' r='11'/><circle cx='0' cy='0' r='20'/><circle cx='0' cy='0' r='11'/><circle cx='40' cy='0' r='20'/><circle cx='40' cy='0' r='11'/><circle cx='0' cy='40' r='20'/><circle cx='0' cy='40' r='11'/><circle cx='40' cy='40' r='20'/><circle cx='40' cy='40' r='11'/></g></svg>")`;
const heroGlow =
  "radial-gradient(60% 75% at 50% 0%, rgba(255,255,255,0.16), transparent 70%)";
</script>
<template>
  <div class="h-full overflow-y-auto bg-surface">
    <!-- Hero -->
    <section
      class="relative isolate overflow-hidden bg-primary px-4 py-20 text-center text-primary-foreground sm:py-24"
    >
      <div
        class="pointer-events-none absolute inset-0 -z-10"
        :style="{ background: heroGlow }"
      ></div>
      <div
        class="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        :style="{ backgroundImage: heroWave, backgroundSize: '40px 40px' }"
      ></div>

      <span class="ds-eyebrow !text-accent-200">
        {{ isEn ? "IIIF Georeferencing" : "IIIF ジオリファレンス" }}
      </span>
      <h1 class="ds-display mt-3 !text-primary-foreground">
        IIIF Georeference Viewer
      </h1>
      <p class="mx-auto mt-4 max-w-xl text-base opacity-90 sm:text-lg">
        {{
          isEn
            ? "Visualize historical maps and images with geographic context"
            : "歴史的な地図や画像を地理的コンテキストで可視化"
        }}
      </p>

      <!-- Main input — a single search-bar pill -->
      <div
        ref="inputCard"
        class="mx-auto mt-9 flex max-w-2xl items-stretch gap-2 rounded-2xl bg-surface p-2 text-left shadow-xl ring-1 ring-black/5"
      >
        <div class="flex flex-1 items-center gap-2 pl-3">
          <DsIcon
            :path="mdiLinkVariant"
            size="1.25rem"
            class="shrink-0 text-foreground-subtle"
          />
          <input
            v-model="u"
            type="url"
            :placeholder="
              isEn
                ? 'Paste a Canvas or Manifest URL'
                : 'Canvas / Manifest URL を貼り付け'
            "
            class="w-full bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground-subtle"
            @keyup.enter="add"
          />
        </div>
        <!-- rounded-xl (16px) = outer rounded-2xl (24px) − p-2 (8px), so the
             button corners nest concentrically inside the search-bar pill. -->
        <DsButton
          variant="primary"
          class="!rounded-xl px-5"
          :disabled="!u"
          @click="add"
        >
          <span class="hidden sm:inline">{{ isEn ? "View" : "表示" }}</span>
          <DsIcon :path="mdiArrowRight" size="1.25rem" />
        </DsButton>
      </div>
      <p class="mt-3 text-xs text-primary-foreground/70">
        {{ isEn ? "or try an example below" : "またはサンプルから試す" }}
      </p>
    </section>

    <!-- Intro video -->
    <section class="mx-auto w-full max-w-5xl px-4 py-14">
      <div class="ds-section-header">
        <h2 class="text-2xl font-semibold text-foreground">
          {{ isEn ? "Introduction" : "紹介動画" }}
        </h2>
        <span class="ds-rule"></span>
      </div>
      <div
        class="overflow-hidden rounded-xl border border-border bg-black shadow-md"
      >
        <iframe
          :key="videoId"
          class="aspect-video w-full"
          :src="`https://www.youtube-nocookie.com/embed/${videoId}`"
          title="IIIF Georeference Viewer"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
    </section>

    <!-- Examples -->
    <section class="mx-auto w-full max-w-5xl px-4 py-14">
      <div class="ds-section-header">
        <h2 class="text-2xl font-semibold text-foreground">
          {{ isEn ? "Try Examples" : "サンプルを試す" }}
        </h2>
        <span class="ds-rule"></span>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(ex, i) in examples"
          :key="i"
          class="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-md"
        >
          <div class="mb-3 flex items-start justify-between">
            <span class="ds-eyebrow">
              {{ isEn ? "Example" : "例" }} {{ i + 1 }}
            </span>
            <a
              :href="ex.value"
              target="_blank"
              rel="noopener"
              :aria-label="isEn ? 'Open in new tab' : '新しいタブで開く'"
              class="-mt-1 -mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-subtle no-underline transition-colors hover:bg-surface-muted hover:text-link"
            >
              <DsIcon :path="mdiOpenInNew" size="1.1rem" />
            </a>
          </div>
          <h3 class="mb-1 text-base font-semibold text-foreground">
            {{ tr(ex.label) }}
          </h3>
          <p class="mb-4 flex-1 text-sm text-foreground-muted">
            {{ tr(ex.description) }}
          </p>
          <DsButton variant="secondary" block @click="selectExample(ex.value)">
            {{ isEn ? "Load Example" : "読み込む" }}
            <DsIcon :path="mdiArrowRight" size="1.1rem" />
          </DsButton>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-surface-muted">
      <div class="mx-auto w-full max-w-5xl px-4 py-14">
        <div class="ds-section-header">
          <h2 class="text-2xl font-semibold text-foreground">
            {{ isEn ? "Features" : "機能" }}
          </h2>
          <span class="ds-rule"></span>
        </div>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(feature, i) in features"
            :key="i"
            class="flex items-start gap-4 rounded-xl border border-border bg-surface p-5"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary"
            >
              <DsIcon :path="feature.icon" size="1.5rem" />
            </div>
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-foreground">
                {{ tr(feature.title) }}
              </h3>
              <p class="mt-1 text-sm text-foreground-muted">
                {{ tr(feature.description) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- News -->
    <section class="mx-auto w-full max-w-5xl px-4 py-14">
      <div class="ds-section-header">
        <h2 class="text-2xl font-semibold text-foreground">
          {{ isEn ? "News" : "お知らせ" }}
        </h2>
        <span class="ds-rule"></span>
      </div>
      <ul class="divide-y divide-border">
        <li
          v-for="(n, i) in newsEntries"
          :key="n.date"
          class="flex flex-col gap-1 py-4 sm:flex-row sm:gap-5"
        >
          <time class="shrink-0 text-sm text-foreground-muted sm:w-28 sm:pt-0.5">
            {{ tr(n.dateLabel) }}
          </time>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-foreground">{{ tr(n.title) }}</span>
              <span
                v-if="i === 0 && hasUnread"
                class="rounded-full bg-accent px-1.5 py-0.5 text-[0.625rem] font-semibold leading-none text-accent-foreground"
              >
                New
              </span>
            </div>
            <p v-if="n.detail" class="mt-1 text-sm text-foreground-muted">
              {{ tr(n.detail) }}
            </p>
          </div>
        </li>
      </ul>
    </section>

    <!-- Footer -->
    <footer
      class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border px-4 py-8 text-sm text-foreground-muted"
    >
      <span>IIIF Georeference Viewer</span>
      <span class="text-border-strong">·</span>
      <a
        href="https://github.com/nakamura196/iiif_geo"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 no-underline hover:text-link"
      >
        <DsIcon :path="mdiGithub" size="1.1rem" />
        GitHub
      </a>
      <span class="text-border-strong">·</span>
      <a
        href="https://nakamura196.github.io/portfolio/"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 no-underline hover:text-link"
      >
        {{ $t("otherTools") }}
      </a>
      <span class="text-border-strong">·</span>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 hover:text-link"
        @click="openPrivacy"
      >
        <DsIcon :path="mdiShieldLockOutline" size="1.1rem" />
        {{ $t("privacy") }}
      </button>
    </footer>
  </div>
</template>
