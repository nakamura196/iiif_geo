<script setup lang="ts">
// Always-mounted news dialog (opened from the menu item, useful on the viewer
// page where the landing-page list isn't shown). Renders the shared list from
// useNews(); open state lives there too.
import { mdiBullhorn } from "@mdi/js";

const { isOpen, newsEntries, hasUnread } = useNews();
const { tr } = useTr();
</script>
<template>
  <DsDialog v-model="isOpen" max-width="40rem">
    <!-- Header -->
    <DsDialogHeader
      :icon="mdiBullhorn"
      :title="$t('news')"
      :close-label="$t('close')"
      @close="isOpen = false"
    />

    <!-- List -->
    <ul class="mt-3 max-h-[65vh] divide-y divide-border overflow-y-auto pr-1">
      <li v-for="(n, i) in newsEntries" :key="n.date" class="flex gap-4 py-3.5">
        <time class="w-24 shrink-0 pt-0.5 text-sm text-foreground-muted">
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

    <div class="mt-6">
      <DsButton variant="primary" block @click="isOpen = false">{{
        $t("close")
      }}</DsButton>
    </div>
  </DsDialog>
</template>
