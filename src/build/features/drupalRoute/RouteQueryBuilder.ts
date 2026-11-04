import {
  isAbstractType,
  type FragmentDefinitionNode,
  type GraphQLInterfaceType,
  type GraphQLSchema,
} from 'graphql'
import type { ModuleContext } from 'nuxt-graphql-middleware/utils'
import { pascalCase } from 'change-case'

export class RouteQueryBuilder {
  private entityFragments = new Set<string>()
  private typesImplementingEntity: Set<string>
  private schema: GraphQLSchema

  /**
   * The object types that implement "Entity", sorted by name.
   */
  public entityObjectTypes: string[]

  /**
   * The type condition of every fragment, keyed by fragment name.
   */
  private fragmentTypes = new Map<string, string>()

  constructor(graphql: ModuleContext) {
    this.schema = graphql.getSchema()
    const entityInterface = graphql.schemaGetType(
      'Entity',
    ) as GraphQLInterfaceType
    const result = this.schema.getImplementations(entityInterface)

    this.typesImplementingEntity = new Set(
      [...result.interfaces, ...result.objects].map((v) => v.name),
    )
    this.entityObjectTypes = result.objects.map((v) => v.name).sort()
  }

  public handleFragments(fragments: FragmentDefinitionNode[]) {
    this.entityFragments.clear()
    this.fragmentTypes.clear()
    for (const fragment of fragments) {
      const typeName = fragment.typeCondition.name.value
      this.fragmentTypes.set(fragment.name.value, typeName)
      if (this.typesImplementingEntity.has(typeName)) {
        this.entityFragments.add(fragment.name.value)
      }
    }
  }

  /**
   * Returns the object types that the fragment matches, sorted by name.
   *
   * A fragment on an interface such as "Node" matches every object type that
   * implements it.
   */
  public getFragmentObjectTypes(fragmentName: string): string[] {
    const typeName = this.fragmentTypes.get(fragmentName)
    const type = typeName ? this.schema.getType(typeName) : undefined
    if (!type) {
      throw new Error(
        `The fragment "${fragmentName}" of a route query does not exist.`,
      )
    }
    if (isAbstractType(type)) {
      return this.schema
        .getPossibleTypes(type)
        .map((v) => v.name)
        .sort()
    }
    return [type.name]
  }

  public buildGraphqlTypesTemplate() {
    const fragments = [...this.entityFragments.values()].map((fragmentName) => {
      const typeName = pascalCase(fragmentName + 'Fragment')
      const line = `"${fragmentName}": ${typeName}`
      return { typeName, line }
    })

    const imports = fragments.map((v) => v.typeName).join(',\n  ')
    const types = fragments.map((v) => v.line).join(',\n    ')
    return `
import type {
  ${imports}
} from '#graphql-operations'

declare module '#vuepal-build/graphql' {
  export type EntityFragment = {
    ${types}
  }
}
`.trim()
  }
}
