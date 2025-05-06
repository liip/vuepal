import type { Link, Meta, Script } from '@unhead/vue'

export type DrupalRouteMetatags = {
  title: string
  link: Link[]
  meta: Meta[]
  script: Script[]
  schemaOrg: string
}
