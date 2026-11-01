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
    <div
      class="drupal-route"
      :data-route-name="drupalRoute.name"
      :data-entity-type="drupalRoute.entityType"
      :data-entity-bundle="drupalRoute.entityBundle"
      :data-entity-id="drupalRoute.entityId"
    />
  </div>
</template>

<script lang="ts" setup>
import { useDrupalRouteQuery } from '#imports'
import { NodeArticle, NodePage, PageHeader } from '#components'

const { entity, redirect, drupalRoute } =
  await useDrupalRouteQuery('nodeCanonical')
</script>
