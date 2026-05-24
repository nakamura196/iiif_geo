<script setup lang="ts">
import { mdiPlusCircle, mdiLinkVariant, mdiArrowRight } from "@mdi/js";

const dialog = ref(false);
const u = ref("");

const localePath = useLocalePath();
const { isEn, tr } = useTr();
const examples = useIiifExamples();

const add = (value?: string) => {
  const target = value ?? u.value;
  if (!target) return;
  useRouter().push(
    localePath({ name: "index", query: { u: target } })
  );
  dialog.value = false;
  u.value = "";
};
</script>
<template>
  <DsButton variant="ghost" @click="dialog = !dialog">
    <DsIcon :path="mdiPlusCircle" size="1.25rem" />
    {{ $t("add") }}
  </DsButton>

  <DsDialog v-model="dialog" max-width="34rem">
    <!-- Header -->
    <DsDialogHeader
      :icon="mdiPlusCircle"
      :title="$t('add')"
      :close-label="$t('close')"
      @close="dialog = false"
    />

    <p class="mt-3 text-sm text-foreground-muted">
      {{
        isEn
          ? "Enter a IIIF Canvas or Manifest URL to load."
          : "IIIF の Canvas または Manifest の URL を入力して読み込みます。"
      }}
    </p>

    <!-- URL input bar -->
    <div
      class="mt-3 flex items-stretch gap-2 rounded-xl border border-border bg-surface p-1.5 transition-colors focus-within:border-accent-400"
    >
      <div class="flex flex-1 items-center gap-2 pl-2">
        <DsIcon
          :path="mdiLinkVariant"
          size="1.2rem"
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
          @keyup.enter="add()"
        />
      </div>
      <DsButton variant="primary" class="px-4" :disabled="!u" @click="add()">
        <span class="hidden sm:inline">{{ isEn ? "View" : "表示" }}</span>
        <DsIcon :path="mdiArrowRight" size="1.2rem" />
      </DsButton>
    </div>

    <!-- Example quick-fill -->
    <div class="mt-6">
      <p class="ds-eyebrow mb-2">{{ isEn ? "Examples" : "サンプル" }}</p>
      <div class="flex flex-col gap-2">
        <button
          v-for="(ex, i) in examples"
          :key="i"
          type="button"
          class="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-accent-200 hover:bg-surface-muted"
          @click="add(ex.value)"
        >
          <span class="ds-eyebrow shrink-0">{{ isEn ? "Ex" : "例" }} {{ i + 1 }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-foreground">
              {{ tr(ex.label) }}
            </span>
            <span class="block truncate text-xs text-foreground-muted">
              {{ tr(ex.description) }}
            </span>
          </span>
          <DsIcon
            :path="mdiArrowRight"
            size="1.1rem"
            class="shrink-0 text-foreground-subtle transition-colors group-hover:text-accent-400"
          />
        </button>
      </div>
    </div>
  </DsDialog>
</template>
