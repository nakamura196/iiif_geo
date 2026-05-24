<script setup lang="ts">
import { mdiClose } from "@mdi/js";

const { toasts, dismiss } = useToast();
</script>
<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 bottom-4 z-[var(--z-toast)] flex flex-col items-center gap-2 px-4"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg px-4 py-2.5 text-sm shadow-lg"
        :class="
          t.type === 'error'
            ? 'bg-danger-500 text-neutral-0'
            : 'bg-foreground text-background'
        "
      >
        <span>{{ t.message }}</span>
        <button
          type="button"
          class="shrink-0 opacity-80 transition-opacity hover:opacity-100"
          :aria-label="$t('close')"
          @click="dismiss(t.id)"
        >
          <DsIcon :path="mdiClose" size="1rem" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
