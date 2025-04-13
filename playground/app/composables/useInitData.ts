import { computed, useState, type ComputedRef } from '#imports'
import type { InitData, MenuLink } from '~/types'

type UseInitData = {
  menuLinks: ComputedRef<MenuLink[]>
}

export default async function (): Promise<UseInitData> {
  const isLoaded = useState('initDataLoaded', () => false)
  const data = useState<InitData>('initData', () => {
    return {
      menuLinks: [],
    }
  })

  if (!isLoaded.value) {
    console.log('Performing init data request.')
    data.value = await $fetch('/api/initData')
    isLoaded.value = true
  }

  const menuLinks = computed(() => data.value.menuLinks)

  return { menuLinks }
}
