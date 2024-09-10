export interface DrupalRouteEntityFragment {
  entity?: { entityBundle: string; entityTypeId: string; id: string }
}

export interface MetatagAttributeFragment {
  key: string
  value: string
}

export interface MetatagFragment {
  id: string
  tag: string
  attributes: Array<MetatagAttributeFragment>
}

export interface DrupalRouteEntity {
  entityBundle: string
  entityTypeId: string
  id?: string
  uuid: string
}

export interface UseDrupalRouteQuery<T> {
  route?:
    | {
        path?: string | undefined | null
        routeName?: string | undefined | null
        redirect?: { statusCode?: number } | undefined | null
        drupalRouteEntity?: DrupalRouteEntity | undefined | null
        metatags?: MetatagFragment[] | undefined | null
        entity?: T | undefined | null
      }
    | undefined
    | null
}
