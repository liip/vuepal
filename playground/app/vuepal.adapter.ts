import { defineVuepalAdapter } from './../../src/adapter'
import { useCurrentLanguage, useGraphqlQuery } from '#imports'

export default defineVuepalAdapter(() => {
  return {
    getAdminMenu() {
      return useGraphqlQuery('adminToolbar').then((v) => v.data)
    },
    getLocalTasks() {
      return $fetch<any>('/api/localTasks').then(
        (v) => v.data.route.localTasks || [],
      )
    },
    getCurrentLanguage() {
      return useCurrentLanguage()
    },
  }
})
