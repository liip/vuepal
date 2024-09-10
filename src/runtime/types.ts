import type { ComputedRef } from '#imports'

export type Nullable<T> = T | undefined | null

export type AdminMenuLinkFragment = {
  link?: Nullable<{
    label?: Nullable<string>
    url?: Nullable<{ routeName?: Nullable<string>; path?: Nullable<string> }>
  }>
  subtree?: AdminMenuLinkFragment[]
}

export type AdminToolbarQuery = {
  activeEnvironment?: Nullable<{
    name?: Nullable<string>
    bgColor?: Nullable<string>
    fgColor?: Nullable<string>
  }>
  menu?: {
    links?: AdminMenuLinkFragment[]
  }
}
export type LocalTask = {
  baseId?: string
  active?: boolean
  title?: string
  url: { routeName?: Nullable<string>; path?: Nullable<string> }
}

export type VuepalAdapter = {
  /**
   * Return the current language as a computed property.
   */
  getCurrentLanguage: () => ComputedRef<string>

  /**
   * Load the admin menu data.
   */
  getAdminMenu?: () => Promise<AdminToolbarQuery | undefined>

  /**
   * Load the local tasks data for the given path.
   */
  getLocalTasks?: (path: string) => Promise<LocalTask[]>
}

export type VuepalAdapterFactory = () => VuepalAdapter

/**
 * Define the Vuepal adapter.
 *
 * This method should return an object that implements the methods required for the enabled features.
 */
export function defineVuepalAdapter(cb: VuepalAdapterFactory): VuepalAdapter {
  return cb()
}
