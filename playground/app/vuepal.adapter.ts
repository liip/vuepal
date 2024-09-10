import { defineVuepalAdapter } from '#vuepal/types'
import { useCurrentLanguage } from '#imports'

export default defineVuepalAdapter(() => {
  return {
    getAdminMenu() {
      return $fetch('/api/adminMenu').then((v) => v.data || {})
    },
    getLocalTasks() {
      return $fetch('/api/localTasks').then(
        (v) => v.data.route.localTasks || [],
      )
    },
    getCurrentLanguage() {
      return useCurrentLanguage()
    },
  }
})
