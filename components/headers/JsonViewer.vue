<script setup lang="ts">
import { mdiCodeJson, mdiContentCopy, mdiCheck, mdiOpenInNew } from "@mdi/js";

const { canvases } = useSettings();

const dialog = ref(false);
const jsonData = ref("");
const currentUrl = ref("");
const loading = ref(false);
const copied = ref(false);

const route = useRoute();

const openJsonViewer = async () => {
  // 現在のCanvasまたはManifestのURLを取得
  const url = route.query.u as string;
  if (!url) return;

  currentUrl.value = url;
  jsonData.value = "";
  loading.value = true;
  dialog.value = true;

  try {
    // 元のJSONデータを取得
    const response = await fetch(url);
    const data = await response.json();
    jsonData.value = JSON.stringify(data, null, 2);
  } catch (error) {
    // エラーの場合は現在のcanvasesデータを表示
    if (canvases.value && canvases.value.length > 0) {
      const data = {
        error: "Could not fetch original JSON",
        currentData: {
          url: url,
          canvases: canvases.value,
          totalCanvases: canvases.value.length,
        },
      };
      jsonData.value = JSON.stringify(data, null, 2);
    }
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = async () => {
  await navigator.clipboard.writeText(jsonData.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
};

const openInNewTab = () => {
  if (currentUrl.value) {
    window.open(currentUrl.value, "_blank");
  }
};
</script>

<template>
  <div>
    <DsButton variant="ghost" @click="openJsonViewer">
      <DsIcon :path="mdiCodeJson" size="1.25rem" />
      {{ $t("viewJson") }}
    </DsButton>

    <DsDialog v-model="dialog" max-width="50rem">
      <!-- Header -->
      <DsDialogHeader
        :icon="mdiCodeJson"
        :title="$t('jsonData')"
        :close-label="$t('close')"
        @close="dialog = false"
      />

      <!-- Source URL -->
      <div
        class="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2"
      >
        <span
          class="shrink-0 text-2xs font-semibold uppercase tracking-wide text-foreground-subtle"
          >URL</span
        >
        <code class="truncate text-xs text-foreground-muted" :title="currentUrl">{{
          currentUrl
        }}</code>
        <span class="flex-1"></span>
        <a
          :href="currentUrl"
          target="_blank"
          rel="noopener"
          :aria-label="$t('openInNewTab')"
          class="shrink-0 text-foreground-subtle no-underline transition-colors hover:text-link"
        >
          <DsIcon :path="mdiOpenInNew" size="1.1rem" />
        </a>
      </div>

      <!-- Code block -->
      <div
        v-if="loading"
        class="json-block mt-3 flex items-center justify-center text-sm text-foreground-subtle"
      >
        …
      </div>
      <pre v-else class="json-block mt-3"><code>{{ jsonData }}</code></pre>

      <!-- Actions -->
      <div class="mt-5 flex flex-wrap items-center gap-2">
        <DsButton variant="primary" :disabled="!jsonData" @click="copyToClipboard">
          <DsIcon :path="copied ? mdiCheck : mdiContentCopy" size="1.1rem" />
          {{ copied ? $t("copied") : $t("copyToClipboard") }}
        </DsButton>
        <DsButton
          variant="secondary"
          :disabled="!currentUrl"
          @click="openInNewTab"
        >
          <DsIcon :path="mdiOpenInNew" size="1.1rem" />
          {{ $t("openInNewTab") }}
        </DsButton>
        <span class="flex-1"></span>
        <DsButton variant="ghost" @click="dialog = false">
          {{ $t("close") }}
        </DsButton>
      </div>
    </DsDialog>
  </div>
</template>

<style scoped>
.json-block {
  max-height: 50vh;
  min-height: 8rem;
  overflow: auto;
  margin: 0;
  padding: 0.875rem 1rem;
  background-color: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--color-foreground);
  white-space: pre;
  tab-size: 2;
}
</style>
