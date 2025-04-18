<template>
  <div>
    <div class="playground-admin">
      <VuepalAdminToolbar />
      <VuepalLocalTasks />
    </div>
    <div v-if="originErrorMessage" class="origin-error-message">
      {{ originErrorMessage }}
    </div>
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { VuepalLocalTasks, VuepalAdminToolbar } from '#components'
import { useTrustedOrigin } from '#imports'

const originErrorMessage = useTrustedOrigin({
  redirect: true,
})
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

.origin-error-message {
  position: fixed;
  z-index: 999999999;
  background: red;
  color: white;
  font-size: 40px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 1.5rem;
  text-align: center;
}
</style>
