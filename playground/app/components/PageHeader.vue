<template>
  <div class="page-header">
    <nav class="language-switch">
      <template v-for="link in languageLinks" :key="link.code">
        <NuxtLink
          v-if="link.enabled && link.to"
          :to="link.to"
          :hreflang="link.code"
          :class="{ 'is-active': link.active }"
          >{{ link.code }}</NuxtLink
        >
      </template>
    </nav>
    <VuepalBreadcrumb v-slot="{ links }">
      <ol class="breadcrumb">
        <li v-for="(link, i) in links" :key="i">
          <NuxtLink v-if="link.url?.path" :to="link.url.path">{{
            link.title
          }}</NuxtLink>
        </li>
      </ol>
    </VuepalBreadcrumb>
    <div v-if="messages.length" class="drupal-messages">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-for="(message, i) in messages" :key="i" v-html="message.safe" />
    </div>
    <div
      class="route-hook"
      :data-query-name="routeHook.queryName"
      :data-entity-type="routeHook.entityType"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Language links, breadcrumb and Drupal messages of the current page.
 *
 * Rendered by the pages, after their useDrupalRoute() call has filled the
 * state. During SSR, the layout renders before the page's async setup is done.
 */
import { useLanguageLinks, useState } from '#imports'
import { VuepalBreadcrumb } from '#components'
import type { DrupalMessage, RouteHookState } from '~/plugins/drupalRoute'

const languageLinks = useLanguageLinks()
const messages = useState<DrupalMessage[]>('drupalMessages', () => [])
const routeHook = useState<RouteHookState>('routeHook', () => ({}))
</script>
