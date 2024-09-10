<template>
  <div>
    <div class="playground-admin">
      <VuepalAdminToolbar />
      <VuepalLocalTasks />
    </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import VuepalAdminToolbar from './../src/runtime/components/AdminToolbar/index.vue'
import { VuepalLocalTasks } from '#components'
</script>

<style lang="css">
.playground-admin {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
}

body {
  font-family: sans-serif;
}
</style>
