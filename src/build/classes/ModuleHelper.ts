import {
  addComponent,
  addImports,
  addPlugin,
  addServerImports,
  addTemplate,
  addTypeTemplate,
  createResolver,
  type Resolver,
} from '@nuxt/kit'
import { isObjectType, isInterfaceType } from 'graphql'
import { relative } from 'pathe'
import type { Nuxt, NuxtPlugin, ResolvedNuxtTemplate } from 'nuxt/schema'
import { fileExists, logger } from '../helpers'
import { useGraphqlModuleContext } from 'nuxt-graphql-middleware/utils'
import { FileCache } from './FileCache'
import type { ModuleOptions } from '../types/options'
import { FEATURE_KEYS, type ValidFeature } from '../features'

type GraphqlModuleContext = NonNullable<
  ReturnType<typeof useGraphqlModuleContext>
>

type ModuleHelperResolvers = {
  /**
   * Resolver for paths relative to the module root.
   */
  module: Resolver

  /**
   * Resolve relative to the app's server directory.
   */
  server: Resolver

  /**
   * Resolve relative to the Nuxt src folder.
   */
  src: Resolver

  /**
   * Resolve relative to the Nuxt app directory.
   */
  app: Resolver

  /**
   * Resolve relative to the Nuxt root.
   *
   * Should be where nuxt.config.ts is located.
   */
  root: Resolver
}

type ModuleHelperPaths = {
  runtimeTypes: string
  root: string
  nuxtConfig: string
  serverDir: string
  moduleBuildDir: string
  /**
   * The absolute path to the vuepal.adapter.ts file.
   */
  vuepalAdapterFile: string
}

export class ModuleHelper {
  public readonly resolvers: ModuleHelperResolvers
  public readonly paths: ModuleHelperPaths

  public readonly isDev: boolean
  public readonly isModuleBuild: boolean
  public readonly isDebug: boolean

  private nitroExternals: string[] = []
  private tsPaths: Record<string, string> = {}

  public readonly graphql: GraphqlModuleContext

  public readonly caches: FileCache<unknown>[] = []

  private enabledFeatures = new Set<ValidFeature>()

  constructor(
    public nuxt: Nuxt,
    moduleOptions: ModuleOptions,
    moduleUrl: string,
    options: { debug?: boolean; isModuleBuild: boolean },
  ) {
    this.isModuleBuild = options.isModuleBuild
    this.isDebug = !!options.debug

    this.graphql = useGraphqlModuleContext()

    FEATURE_KEYS.forEach((key) => {
      if (moduleOptions[key]?.enabled || this.isModuleBuild) {
        this.enabledFeatures.add(key)
      }
    })

    // Resolver for the root directory.
    const srcResolver = createResolver(nuxt.options.srcDir)
    const rootResolver = createResolver(nuxt.options.rootDir)

    this.isDev = nuxt.options.dev
    this.resolvers = {
      module: createResolver(moduleUrl),
      server: createResolver(nuxt.options.serverDir),
      src: srcResolver,
      app: createResolver(nuxt.options.dir.app),
      root: rootResolver,
    }

    this.paths = {
      runtimeTypes: '',
      root: nuxt.options.rootDir,
      nuxtConfig: this.resolvers.root.resolve('nuxt.config.ts'),
      serverDir: nuxt.options.serverDir,
      moduleBuildDir: nuxt.options.buildDir + '/vuepal-build',
      vuepalAdapterFile: this.findVuepalAdapter(),
    }

    // This path needs to be built afterwards since the method we call
    // depends on a value of this.paths.
    this.paths.runtimeTypes = this.toModuleBuildRelative(
      this.resolvers.module.resolve('./runtime/types.ts'),
    )
  }

  public resolveUserPath(path: string): string {
    return this.resolvers.root.resolve(path)
  }

  private findVuepalAdapter(): string {
    const filePath = this.resolvers.app.resolve('vuepal.adapter')

    if (fileExists(filePath)) {
      return filePath
    }

    throw new Error(`Missing vuepal.adapter.ts in ${filePath}.`)
  }

  /**
   * Transform the path relative to the module's build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toModuleBuildRelative(path: string): string {
    return relative(this.paths.moduleBuildDir, path)
  }

  /**
   * Transform the path relative to the Nuxt build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toBuildRelative(path: string): string {
    return relative(this.nuxt.options.buildDir, path)
  }

  /**
   * Transform the path relative to the Nuxt build directory.
   *
   * @param path - The absolute path.
   *
   * @returns The path relative to the module's build directory.
   */
  public toSourceRelative(path: string): string {
    return relative(process.cwd(), path)
  }

  public addAlias(name: string, path: string) {
    this.nuxt.options.alias[name] = path

    // In our case, the name of the alias corresponds to a folder in the build
    // dir with the same name (minus the #).
    const pathFromName = `./${name.substring(1)}`

    this.tsPaths[name] = pathFromName
    this.tsPaths[name + '/*'] = pathFromName + '/*'

    // Add the alias as an external so that the nitro server build doesn't fail.
    this.inlineNitroExternals(name)
  }

  public inlineNitroExternals(arg: ResolvedNuxtTemplate | string) {
    const path = typeof arg === 'string' ? arg : arg.dst
    this.nitroExternals.push(path)
    this.transpile(path)
  }

  public transpile(path: string) {
    this.nuxt.options.build.transpile.push(path)
  }

  public applyBuildConfig() {
    // Workaround for https://github.com/nuxt/nuxt/issues/28995
    this.nuxt.options.nitro.externals ||= {}
    this.nuxt.options.nitro.externals.inline ||= []
    this.nuxt.options.nitro.externals.inline.push(...this.nitroExternals)

    // Currently needed due to a bug in Nuxt that does not add aliases for
    // nitro. As this has happened before in the past, let's leave it so that
    // we are guaranteed to have these aliases also for server types.
    this.nuxt.options.nitro.typescript ||= {}
    this.nuxt.options.nitro.typescript.tsConfig ||= {}
    this.nuxt.options.nitro.typescript.tsConfig.compilerOptions ||= {}
    this.nuxt.options.nitro.typescript.tsConfig.compilerOptions.paths ||= {}

    this.nuxt.options.typescript.tsConfig ||= {}
    this.nuxt.options.typescript.tsConfig.compilerOptions ||= {}
    this.nuxt.options.typescript.tsConfig.compilerOptions.paths ||= {}

    for (const [name, path] of Object.entries(this.tsPaths)) {
      this.nuxt.options.nitro.typescript.tsConfig.compilerOptions.paths[name] =
        [path]
      this.nuxt.options.typescript.tsConfig.compilerOptions.paths[name] = [path]
    }

    this.logDebug('Applied build config')
  }

  public addTemplate(
    path: string,
    build?: (() => string) | null,
    buildTypes?: (() => string | (() => string)) | null,
  ) {
    if (build) {
      const content = build().trim()
      const filename = path.startsWith('/')
        ? path
        : 'vuepal-build/' + path + '.js'
      addTemplate({
        filename,
        write: true,
        getContents: () => content,
      })
    }

    if (buildTypes) {
      if (path.startsWith('/')) {
        throw new Error('buildTypes is not available for absolute paths.')
      }
      const result = buildTypes()
      const getContents = typeof result === 'string' ? () => result : result
      const filename = 'vuepal-build/' + path + '.d.ts'
      addTypeTemplate(
        {
          filename: filename as `${string}.d.ts`,
          write: true,
          getContents,
        },
        {
          nuxt: true,
          nitro: true,
        },
      )
    }
  }

  public addPlugin(name: string, mode: NuxtPlugin['mode'] = 'all') {
    addPlugin(
      { src: this.resolvers.module.resolve('./runtime/plugins/' + name), mode },
      {
        append: false,
      },
    )
  }

  public addComposable(name: string) {
    addImports({
      from: this.resolvers.module.resolve(
        './runtime/composables/' + name + '/index',
      ),
      name,
    })
  }

  public addComponent(name: string) {
    addComponent({
      filePath: this.resolvers.module.resolve(
        `./runtime/components/${name}/index`,
      ),
      name,
      global: true,
    })
  }

  public addServerUtil(name: string) {
    addServerImports([
      {
        from: this.resolvers.module.resolve('./runtime/server/utils/' + name),
        name,
      },
    ])
  }

  public logDebug(...args: unknown[]) {
    if (this.isDebug) {
      if (args.length !== 0) {
        // Pass the first argument as-is, then spread the rest
        logger.info(args[0], ...args.slice(1))
      }
    }
  }

  public assertGraphqlEntityType(entityType: string): ModuleHelper {
    return this.assertGraphqlObjectField({ entityType }, entityType)
  }

  public assertGraphqlEntityBaseField(fieldName: string): ModuleHelper {
    return this.assertGraphqlObjectField(
      `Please enable the "${fieldName}" entity base field in your GraphQL schema in Drupal.`,
      'Entity',
      fieldName,
    )
  }

  public assertGraphqlObjectField(
    context: { extension: string } | { entityType: string } | string,
    typeName: string,
    fieldName?: string,
  ): ModuleHelper {
    const message =
      typeof context === 'string'
        ? context
        : 'extension' in context
          ? `Please enable the "${context.extension}" GraphQL schema extension in Drupal.`
          : `Please enable the "${context.entityType}" entity type in your GraphQL schema in Drupal.`

    const type = this.graphql.schemaGetType(typeName)
    if (!type) {
      throw new Error(
        `Missing type "${typeName}" in GraphQL schema. ${message}`,
      )
    }

    if (fieldName) {
      if (!isObjectType(type) && !isInterfaceType(type)) {
        throw new Error('Can only check fields on object or interface types.')
      }
      const fields = type.getFields()
      if (!fields[fieldName]) {
        throw new Error(
          `Missing field "${fieldName}" on type "${typeName}". ${message}`,
        )
      }
    }

    return this
  }

  public addGraphqlFile(fileName: string) {
    const resolved = this.resolvers.module.resolve(
      './runtime/graphql/' + fileName,
    )
    this.graphql.addImportFile(resolved)
  }

  public createFileCache<T>(): FileCache<T> {
    const cache = new FileCache<T>()
    this.caches.push(cache)
    return cache
  }

  public clearFilePathCaches(filePath: string) {
    this.caches.forEach((cache) => cache.clear(filePath))
  }

  public hasFeatureEnabled(key: ValidFeature): boolean {
    return this.enabledFeatures.has(key)
  }
}
