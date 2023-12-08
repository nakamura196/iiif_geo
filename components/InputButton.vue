<script setup lang="ts">
import { mdiPlusCircle } from "@mdi/js";

const dialog = ref(false);
</script>
<template>
  <v-btn @click="dialog = !dialog" class="ma-1">
    <v-icon class="mr-1">{{ mdiPlusCircle }}</v-icon>
    {{ $t("add") }}

    <v-dialog v-model="dialog">
      <v-card>
        <v-card-text>
          <InputForm />
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="dialog = false">{{ $t("close") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-btn>
</template>
