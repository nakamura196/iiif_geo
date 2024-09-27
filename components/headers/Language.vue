<script setup lang="ts">
import { mdiChevronDown } from "@mdi/js";

const i18n = useI18n();

const changeLocale = (locale: string) => {
  i18n.setLocale(locale);
};
</script>
<template>
  <client-only>
    <v-menu offset-y>
      <template v-slot:activator="{ props }">
        <v-btn variant="text" v-bind="props">
          {{ $i18n.locale === "ja" ? "日本語" : "English" }}
          <v-icon> {{ mdiChevronDown }} </v-icon>
        </v-btn>
      </template>
      <v-card flat>
        <v-list>
          <v-list-item @click="changeLocale('ja')" :active="$i18n.locale === 'ja'"
            >日本語</v-list-item
          >
          <v-list-item @click="changeLocale('en')" :active="$i18n.locale === 'en'"
            >English</v-list-item
          >
        </v-list>
      </v-card>
    </v-menu>
  </client-only>
</template>
