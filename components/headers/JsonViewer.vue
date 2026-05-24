<script setup lang="ts">
import { mdiCodeJson, mdiClose } from "@mdi/js";

const { canvases } = useSettings();

const dialog = ref(false);
const jsonData = ref("");
const currentUrl = ref("");

const route = useRoute();

const openJsonViewer = async () => {
  // 現在のCanvasまたはManifestのURLを取得
  const url = route.query.u as string;
  if (!url) return;
  
  currentUrl.value = url;
  
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
        }
      };
      jsonData.value = JSON.stringify(data, null, 2);
    }
  }
  
  dialog.value = true;
};

const copyToClipboard = () => {
  navigator.clipboard.writeText(jsonData.value);
};

const openInNewTab = () => {
  if (currentUrl.value) {
    window.open(currentUrl.value, '_blank');
  }
};
</script>

<template>
  <div>
    <DsButton variant="ghost" @click="openJsonViewer">
      <DsIcon :path="mdiCodeJson" size="1.25rem" />
      {{ $t('viewJson') }}
    </DsButton>

    <DsDialog v-model="dialog" max-width="50rem">
      <div class="flex items-center gap-2">
        <h2 class="text-xl text-foreground">{{ $t('jsonData') }}</h2>
        <span class="flex-1"></span>
        <DsIconButton
          :icon="mdiClose"
          variant="ghost"
          size="sm"
          :label="$t('close')"
          @click="dialog = false"
        />
      </div>

      <div class="mt-4 mb-2 flex items-center gap-2">
        <span
          class="rounded-sm bg-surface-muted px-2 py-0.5 text-xs text-foreground-muted"
          >URL</span
        >
        <code class="json-url">{{ currentUrl }}</code>
      </div>

      <textarea
        v-model="jsonData"
        readonly
        rows="15"
        class="ds-input focus:ds-input-focus json-viewer"
      ></textarea>

      <div class="mt-6 flex flex-wrap items-center gap-2">
        <DsButton variant="primary" :disabled="!currentUrl" @click="openInNewTab">
          {{ $t('openInNewTab') }}
        </DsButton>
        <DsButton variant="secondary" @click="copyToClipboard">
          {{ $t('copyToClipboard') }}
        </DsButton>
        <span class="flex-1"></span>
        <DsButton variant="ghost" @click="dialog = false">
          {{ $t('close') }}
        </DsButton>
      </div>
    </DsDialog>
  </div>
</template>

<style scoped>
.json-viewer {
  font-family: monospace;
  font-size: 12px;
  resize: vertical;
}

.json-url {
  background-color: var(--color-surface-muted);
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}
</style>