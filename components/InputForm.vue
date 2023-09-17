<script setup lang="ts">
const u = ref("");

const ex1 = () => {
  const baseURL = useNuxtApp().$config.app.baseURL;
  const path = baseURL + "/canvas.json";
  u.value = path;
};

const add = () => {
  const router = useRouter();
  router.push({ query: { u: u.value } });
};
</script>
<template>
  <v-container>
    <v-text-field
      v-model="u"
      :label="/*('canvas_url')*/ 'Canvas URL'"
      single-line
      hide-details
      variant="outlined"
      density="compact"
      class="mt-2 mb-4"
      clearable
    ></v-text-field>

    <v-btn @click="add" class="ma-1" color="primary">{{
      /*("add")*/ "追加"
    }}</v-btn>

    <v-btn @click="ex1" class="ma-1">{{ /*("add")*/ "例" }}</v-btn>
  </v-container>
</template>
