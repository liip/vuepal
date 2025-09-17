<template>
  <div>
    <div class="playground-admin">
      <VuepalProvider>
        <VuepalAdminToolbar />
        <VuepalLocalTasks />
      </VuepalProvider>
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
import { narrowTypeByProperty } from '#vuepal/helpers/graphql'

const originErrorMessage = useTrustedOrigin({
  redirect: true,
})

// small section which ensures narrowTypeByProperty works
const a = { a: 5, aa: 7 }
const b = { b: 6, bb: 4 }
const c = Math.random() < 0.5 ? a : b
const d = narrowTypeByProperty(c, 'a')

d?.a
d?.aa
// @ts-expect-error
d?.b
// @ts-expect-error
d?.bb

const e: { a?: number; e: number } = { e: 4 }
const f = Math.random() < 0.5 ? a : e
const g = narrowTypeByProperty(f, 'a')

g?.a
// @ts-expect-error
g?.e
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
