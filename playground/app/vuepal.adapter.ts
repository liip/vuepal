import { defineVuepalAdapter } from './../../src/adapter'
import { useCurrentLanguage, useGraphqlQuery } from '#imports'

export default defineVuepalAdapter(() => {
  return {
    getAdminMenu() {
      return useGraphqlQuery('adminToolbar').then((v) => v.data)
    },
    getLocalTasks(path: string) {
      return useGraphqlQuery('localTasks', { path }).then((v) => {
        if (v.data.route && 'localTasks' in v.data.route) {
          return v.data.route.localTasks
        }
        return []
      })
    },
    getCurrentLanguage() {
      return useCurrentLanguage()
    },
  }
})
