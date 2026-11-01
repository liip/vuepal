<template>
  <div>
    <PageHeader />
    <div v-if="redirect" class="redirect-message">
      <p>You are being redirected.</p>
      <a :href="redirect">Continue</a>
    </div>
    <NodeArticle
      v-else-if="entity && 'lead' in entity"
      :title="entity.title"
      :lead="entity.lead"
    />
    <NodePage v-else-if="entity" :title="entity.title" />
  </div>
</template>

<script lang="ts" setup>
import { useDrupalRouteQuery } from '#imports'
import { NodeArticle, NodePage, PageHeader } from '#components'

const { entity, redirect } = await useDrupalRouteQuery('nodeCanonical')
</script>
