import {
  computed,
  useAsyncData,
  useCurrentLanguage,
  type ComputedRef,
} from '#imports'
import type { InitData, MenuLink } from '~~/types'

type UseInitData = {
  menuLinks: ComputedRef<MenuLink[]>
}

export default async function (): Promise<UseInitData> {
  const language = useCurrentLanguage()
  const { data } = await useAsyncData(
    'initData',
    () =>
      $fetch<InitData>('/api/initData', {
        query: { language: language.value },
      }),
    { watch: [language] },
  )

  const menuLinks = computed(() => data.value?.menuLinks || [])

  return { menuLinks }
}
