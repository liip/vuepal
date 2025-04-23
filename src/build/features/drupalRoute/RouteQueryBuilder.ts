import type { FragmentDefinitionNode, GraphQLInterfaceType } from 'graphql'
import type { ModuleContext } from 'nuxt-graphql-middleware/utils'
import { pascalCase } from 'change-case'

export class RouteQueryBuilder {
  private entityFragments = new Set<string>()
  private typesImplementingEntity: Set<string>

  constructor(graphql: ModuleContext) {
    const entityInterface = graphql.schemaGetType(
      'Entity',
    ) as GraphQLInterfaceType
    const result = graphql.getSchema().getImplementations(entityInterface)

    this.typesImplementingEntity = new Set(
      [...result.interfaces, ...result.objects].map((v) => v.name),
    )
  }

  public handleSchema() {}

  public handleFragments(fragments: FragmentDefinitionNode[]) {
    this.entityFragments.clear()
    for (const fragment of fragments) {
      const typeName = fragment.typeCondition.name.value
      if (this.typesImplementingEntity.has(typeName)) {
        this.entityFragments.add(fragment.name.value)
      }
    }
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
