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

const inputCard = ref<InstanceType<typeof import('vuetify/components')['VCard']> | null>(null);

const selectExample = (value: string) => {
  u.value = value;
  nextTick(() => {
    const el = inputCard.value?.$el as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};
</script>
<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <v-container class="hero-content">
        <h1 class="hero-title">IIIF Georeference Viewer</h1>
        <p class="hero-subtitle">
          {{
            locale === "en"
              ? "Visualize historical maps and images with geographic context"
              : "歴史的な地図や画像を地理的コンテキストで可視化"
          }}
        </p>

        <!-- Main Input Card -->
        <v-card ref="inputCard" class="input-card mx-auto" max-width="700" elevation="8">
          <v-card-text class="pa-6">
            <v-text-field
              v-model="u"
              :label="locale === 'en' ? 'Enter Canvas URL' : 'Canvas URLを入力'"
              :placeholder="
                locale === 'en'
                  ? 'https://example.com/canvas.json'
                  : 'https://example.com/canvas.json'
              "
              variant="outlined"
              hide-details
              class="mb-4"
              clearable
              @keyup.enter="add"
            >
              <template v-slot:append-inner>
                <v-btn
                  color="primary"
                  variant="flat"
                  :disabled="!u"
                  @click="add"
                  class="append-btn"
                >
                  <v-icon>{{ mdiArrowRight }}</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-container>
    </div>

    <!-- Examples Section -->
    <v-container class="examples-section py-12">
      <h2 class="section-title text-center mb-8">
        {{ locale === "en" ? "Try Examples" : "サンプルを試す" }}
      </h2>
      <v-row justify="center">
        <v-col v-for="(ex, i) in examples" :key="i" cols="12" sm="6" md="4">
          <v-card
            class="example-card h-100"
            elevation="2"
            hover
            @click="selectExample(ex.value)"
          >
            <v-card-text class="pa-5">
              <div class="d-flex align-center mb-3">
                <v-chip color="primary" size="small" class="mr-3">
                  {{ locale === "en" ? "Example" : "例" }} {{ i + 1 }}
                </v-chip>
              </div>
              <h3 class="example-title mb-2">
                {{ ex.label[locale === "en" ? "en" : "ja"] }}
              </h3>
              <p class="example-description text-medium-emphasis">
                {{ ex.description[locale === "en" ? "en" : "ja"] }}
              </p>
            </v-card-text>
            <v-card-actions class="px-5 pb-4">
              <v-btn
                color="primary"
                variant="tonal"
                class="flex-grow-1"
                @click.stop="selectExample(ex.value)"
              >
                {{ locale === "en" ? "Load Example" : "読み込む" }}
              </v-btn>
              <v-btn
                icon
                variant="tonal"
                :href="ex.value"
                target="_blank"
                @click.stop
              >
                <v-icon size="small">{{ mdiOpenInNew }}</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Features Section -->
    <div class="features-section py-12">
      <v-container>
        <h2 class="section-title text-center mb-8">
          {{ locale === "en" ? "Features" : "機能" }}
        </h2>
        <v-row justify="center">
          <v-col
            v-for="(feature, i) in features"
            :key="i"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card class="feature-card text-center pa-6 h-100" elevation="0">
              <v-avatar color="primary" size="64" class="mb-4">
                <v-icon size="32" color="white">{{ feature.icon }}</v-icon>
              </v-avatar>
              <h3 class="feature-title mb-2">
                {{ feature.title[locale === "en" ? "en" : "ja"] }}
              </h3>
              <p class="feature-description text-medium-emphasis">
                {{ feature.description[locale === "en" ? "en" : "ja"] }}
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: calc(100vh - 48px);
  background: #fafafa;
}

.hero-section {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 50%, #6a1b9a 100%);
  padding: 80px 0 100px;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.5;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.input-card {
  border-radius: 16px !important;
  backdrop-filter: blur(10px);
}

.append-btn {
  margin-right: -8px;
  border-radius: 8px;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
}

.examples-section {
  background: white;
}

.example-card {
  border-radius: 12px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.example-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1) !important;
}

.example-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.example-description {
  font-size: 0.9rem;
  line-height: 1.5;
}

.features-section {
  background: #f8fafc;
}

.feature-card {
  background: transparent !important;
  border-radius: 12px !important;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.feature-description {
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .hero-section {
    padding: 60px 0 80px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>
