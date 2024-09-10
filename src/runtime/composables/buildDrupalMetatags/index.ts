import type { Link, Meta } from '@unhead/schema'

type GraphqlDrupalMetatagAttribute = {
  key: string
  value: string
}

type GraphqlDrupalMetatag = {
  id?: string
  tag?: string
  attributes: GraphqlDrupalMetatagAttribute[]
}

type GraphqlDrupalMetatags = {
  metatags: GraphqlDrupalMetatag[]
  schema: string
}

type DrupalRouteMetatags = {
  title: string
  link: Link[]
  meta: Link[]
  schema: string
}

/**
 * Get the page title from the Drupal metatags.
 */
function getTitle(tag: GraphqlDrupalMetatag): string | undefined {
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
function getTagObject(
  attributes: GraphqlDrupalMetatagAttribute[],
): Link | Meta {
  return attributes.reduce<Record<string, string>>((acc, v) => {
    acc[v.key] = v.value
    return acc
  }, {})
}

export function buildDrupalMetatags(
  data:
    | GraphqlDrupalMetatags
    | GraphqlDrupalMetatags['metatags']
    | undefined
    | null,
): DrupalRouteMetatags {
  try {
    const link: Link[] = []
    const meta: Meta[] = []
    let title: string = ''
    const schema = data && 'schema' in data ? data.schema : ''

    const tags = data && 'metatags' in data ? data.metatags : data

    if (tags && Array.isArray(tags)) {
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]
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
    }

    return { link, meta, title, schema }
  } catch (e) {
    console.log('Error in Vuepal:')  
    console.log(e)  
  }

  return { link: [], meta: [], title: '', schema: '' }
}
