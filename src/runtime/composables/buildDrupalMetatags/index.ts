import type {
  MetatagFragment,
  UseDrupalRouteFragment,
} from '#graphql-operations'
import type { Link, Meta, Script } from '@unhead/vue'
import type { DrupalRouteMetatags } from '../../types/metatags'

type GraphqlDrupalMetatags = {
  metatags?: MetatagFragment[]
  schemaOrgMetatags?: {
    json?: string
  }
}

/**
 * Get the page title from the Drupal metatags.
 */
function getTitle(tag: MetatagFragment): string | undefined {
  if (tag.id !== 'title') {
    return
  }

  const value = tag.attributes.find((v) => v.key === 'content')
  if (!value) {
    return
  }

  return value.value
}

/**
 * Build the vue-meta object given the Drupal metatag attributes array.
 *
 * The input is an array of e.g.
 * [{ key: 'one', value: 'foo' }, { key: 'two', value: 'bar'  }]
 *
 * The output is an object where each of the key/value pairs is reduced to a
 * single object:
 * { one: 'foo', two: 'bar' }
 */
function getTagObject(attributes: MetatagFragment['attributes']): Link | Meta {
  return attributes.reduce<Record<string, string>>((acc, v) => {
    acc[v.key] = v.value
    return acc
  }, {})
}

export function buildDrupalMetatags(
  data: GraphqlDrupalMetatags | UseDrupalRouteFragment | undefined | null,
): DrupalRouteMetatags {
  try {
    let schemaOrg = ''
    let tags: MetatagFragment[] = []

    if (data && 'route' in data && data.route && 'metatags' in data.route) {
      const route = data.route
      schemaOrg = route.schemaOrgMetatags?.json || ''
      tags = route.metatags
    }

    if (data && 'metatags' in data) {
      schemaOrg = data.schemaOrgMetatags?.json || ''
      tags = data.metatags || []
    }

    const link: Link[] = []
    const meta: Meta[] = []
    const script: Script[] = []

    if (schemaOrg) {
      script.push({
        type: 'application/ld+json',
        innerHTML: schemaOrg,
      })
    }

    let title: string = ''
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i]!
      const tagTitle = getTitle(tag)
      if (tagTitle) {
        title = tagTitle
      } else {
        const item = getTagObject(tag.attributes)
        if (tag.tag === 'link') {
          link.push(item)
        } else if (tag.tag === 'meta') {
          meta.push(item)
        }
      }
    }

    return { link, meta, title, script, schemaOrg }
  } catch (e) {
    console.log('Error in Vuepal:')
    console.log(e)
  }

  return { link: [], meta: [], script: [], title: '', schemaOrg: '' }
}
