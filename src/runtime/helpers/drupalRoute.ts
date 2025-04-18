import type { SerializableHead } from '@unhead/vue'
import type { ComputedRef } from '#imports'

export type DrupalRoute = {
  /**
   * The name of the route, e.g. "entity.node.canonical".
   */
  name?: string

  /**
   * The bundle of the entity, e.g. "page".
   */
  entityBundle?: string

  /**
   * The entity type, e.g. "node".
   */
  entityType?: string

  /**
   * The ID of the entity.
   */
  entityId?: string

  /**
   * The UUID of the entity.
   */
  entityUuid?: string
}

export type UseDrupalRoute<T> = {
  /**
   * The user-specific fields for the entity, according to their fragment.
   */
  entity: ComputedRef<T>

  /**
   * The Drupal route information.
   */
  drupalRoute: ComputedRef<DrupalRoute>

  /**
   * The mapped meta tags.
   */
  metatags: ComputedRef<SerializableHead>
}
