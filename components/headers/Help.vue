<script setup lang="ts">
import { mdiInformation, mdiClose } from "@mdi/js";

const { locale } = useI18n();

interface ContentData extends Record<string, any> {}

const { data } = await useAsyncData<ContentData | null>(
  `help-${locale.value}`,
  async () => {
    const result = await queryCollection("docs")
      .path(`/help/${locale.value}`)
      .first();
    return result || {};
  }
);

const dialog = ref(false);
</script>
<template>
  <v-btn variant="text" @click="dialog = !dialog" class="ma-1">
    <v-icon class="mr-1">{{ mdiInformation }}</v-icon>
    {{ $t("help") }}

    <v-dialog v-model="dialog" max-width="700" scrollable>
      <v-card class="help-dialog">
        <v-toolbar color="purple" density="compact">
          <v-toolbar-title class="text-white">
            <v-icon class="mr-2">{{ mdiInformation }}</v-icon>
            {{ $t("help") }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="dialog = false">
            <v-icon color="white">{{ mdiClose }}</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="help-content pa-6">
          <ContentRenderer v-if="data" class="nuxt-content" :value="data" />
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="purple" variant="flat" @click="dialog = false">
            {{ $t("close") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-btn>
</template>

<style scoped>
.help-dialog {
  border-radius: 12px !important;
  overflow: hidden;
}

.help-content {
  max-height: 60vh;
  overflow-y: auto;
}

.help-content :deep(h1) {
  display: none;
}

.help-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.help-content :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
}

.help-content :deep(b) {
  display: inline-block;
  color: #7b1fa2;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.help-content :deep(p) {
  line-height: 1.7;
  color: #475569;
  margin-bottom: 0.75rem;
}

.help-content :deep(ul) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.help-content :deep(li) {
  line-height: 1.7;
  color: #475569;
  margin-bottom: 0.25rem;
}

.help-content :deep(ul ul) {
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.help-content :deep(code) {
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #7b1fa2;
}

.help-content :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1rem 0;
}

.help-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

.help-content :deep(strong) {
  color: #1e293b;
  font-weight: 600;
}
</style>
