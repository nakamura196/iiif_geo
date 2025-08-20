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
    <v-btn
      variant="text"
      @click="openJsonViewer"
      class="ma-1"
    >
      <v-icon class="mr-1">{{ mdiCodeJson }}</v-icon>
      {{ $t('viewJson') }}
    </v-btn>

    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ $t('jsonData') }}</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="dialog = false"
            variant="text"
            size="small"
          >
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div class="mb-2">
            <v-chip label size="small" class="mr-2">URL</v-chip>
            <code>{{ currentUrl }}</code>
          </div>
          
          <v-textarea
            v-model="jsonData"
            readonly
            rows="15"
            variant="outlined"
            class="json-viewer"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-btn
            color="primary"
            @click="openInNewTab"
            :disabled="!currentUrl"
          >
            {{ $t('openInNewTab') }}
          </v-btn>
          <v-btn
            @click="copyToClipboard"
          >
            {{ $t('copyToClipboard') }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="dialog = false"
          >
            {{ $t('close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.json-viewer {
  font-family: monospace;
  font-size: 12px;
}

code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
}
</style>