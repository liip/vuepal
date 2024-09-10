import { defineVuepalAdapter } from '#vuepal/types'
import { computed } from '#imports'

export default defineVuepalAdapter(() => {
  return {
    getAdminMenu() {
      return Promise.resolve(undefined)
    },
    getCurrentLanguage() {
      return computed(() => 'de')
    },
  }
})
