import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { getIdentifierName, parseTypeScript } from './ast'
import type { DataAttributeTargetApi, DefaultValue } from './types'

export interface RecipeVariantApi {
  name: string
  values: Array<string | number | boolean>
  default?: DefaultValue
}

export interface RecipeApi {
  slots: string[]
  variants: RecipeVariantApi[]
  dataAttributes: DataAttributeTargetApi[]
}

interface RecipeModule {
  filePath: string
  source: string
  bindings: Map<string, ESTree.Expression>
  imports: Map<string, { importedName: string; specifier: string }>
}

interface ResolvedExpression {
  module: RecipeModule
  expression: ESTree.Expression
}

type ObjectProperty = Extract<ESTree.ObjectExpression['properties'][number], { type: 'Property' }>

function propertyName(property: ObjectProperty): string | undefined {
  if (!property.computed) {
    const identifier = getIdentifierName(property.key)
    if (identifier) {
      return identifier
    }
  }
  if (property.key.type === 'Literal') {
    return String(property.key.value)
  }
  return undefined
}

function unwrapExpression(expression: ESTree.Expression): ESTree.Expression {
  let current = expression
  while (
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSNonNullExpression' ||
    current.type === 'ChainExpression'
  ) {
    current = current.expression
  }
  return current
}

function literalDefault(expression: ESTree.Expression): DefaultValue | undefined {
  const current = unwrapExpression(expression)
  if (
    current.type === 'Literal' &&
    (typeof current.value === 'string' ||
      typeof current.value === 'number' ||
      typeof current.value === 'boolean' ||
      current.value === null)
  ) {
    return { kind: 'literal', value: current.value }
  }
  return undefined
}

export class RecipeExtractor {
  readonly #modules = new Map<string, RecipeModule>()

  constructor(readonly projectRoot: string) {}

  async extract(recipePath: string, componentName: string): Promise<RecipeApi> {
    const module = await this.#loadModule(path.resolve(this.projectRoot, recipePath))
    const prefix = `${componentName[0]?.toLowerCase() ?? ''}${componentName.slice(1)}`
    const recipeExpression = await this.#resolveBinding(module, `${prefix}Recipe`)
    if (!recipeExpression) {
      throw new Error(`[api-doc] Missing convention export "${prefix}Recipe" in ${recipePath}.`)
    }
    const recipeCall = unwrapExpression(recipeExpression.expression)
    if (recipeCall.type !== 'CallExpression' || recipeCall.arguments.length < 2) {
      throw RecipeExtractor.#unsupported(recipeExpression.module, `${prefix}Recipe`, recipeCall)
    }
    const configArgument = recipeCall.arguments[1]
    if (!configArgument || configArgument.type === 'SpreadElement') {
      throw RecipeExtractor.#unsupported(
        recipeExpression.module,
        `${prefix}Recipe config`,
        recipeCall,
      )
    }
    const config = await this.#resolveObject(
      recipeExpression.module,
      configArgument,
      'recipe config',
    )
    const slots = await this.#extractSlots(config)
    const variants = await this.#extractVariants(config)

    const dataAttributes = await this.#extractContract(module, `${prefix}DataAttributes`)

    return { slots, variants, dataAttributes }
  }

  async #loadModule(absolutePath: string): Promise<RecipeModule> {
    const cached = this.#modules.get(absolutePath)
    if (cached) {
      return cached
    }
    if (!absolutePath.endsWith('.recipe.ts') || !existsSync(absolutePath)) {
      throw new Error(
        `[api-doc] Recipe extraction may read only existing .recipe.ts files: ${absolutePath}`,
      )
    }

    const source = readFileSync(absolutePath, 'utf8')
    const parsed = await parseTypeScript(absolutePath, source, 'ts')
    const bindings = new Map<string, ESTree.Expression>()
    const imports = new Map<string, { importedName: string; specifier: string }>()

    for (const statement of parsed.program.body) {
      if (statement.type === 'ImportDeclaration') {
        for (const specifier of statement.specifiers) {
          const local = getIdentifierName(specifier.local)
          if (!local) {
            continue
          }
          imports.set(local, {
            importedName:
              specifier.type === 'ImportSpecifier'
                ? (getIdentifierName(specifier.imported) ?? local)
                : 'default',
            specifier: statement.source.value,
          })
        }
        continue
      }
      const declaration =
        statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
      if (declaration?.type !== 'VariableDeclaration') {
        continue
      }
      for (const item of declaration.declarations) {
        if (item.id.type === 'Identifier' && item.init) {
          bindings.set(item.id.name, item.init)
        }
      }
    }

    const module = { filePath: absolutePath, source, bindings, imports }
    this.#modules.set(absolutePath, module)
    return module
  }

  static #resolveRecipeImport(module: RecipeModule, specifier: string, use: string): string {
    if (!specifier.startsWith('.')) {
      throw new Error(
        `[api-doc] ${use} in ${module.filePath} depends on opaque non-recipe import "${specifier}". Move API metadata to a .recipe.ts module.`,
      )
    }
    const unresolved = path.resolve(path.dirname(module.filePath), specifier)
    const candidates = [unresolved, `${unresolved}.recipe.ts`, `${unresolved}.ts`]
    const resolved = candidates.find((candidate) => existsSync(candidate))
    if (!resolved || !resolved.endsWith('.recipe.ts')) {
      throw new Error(
        `[api-doc] ${use} in ${module.filePath} depends on "${specifier}". API metadata dependencies must originate from .recipe.ts files.`,
      )
    }
    return resolved
  }

  async #resolveBinding(
    module: RecipeModule,
    name: string,
    use = name,
  ): Promise<ResolvedExpression | undefined> {
    const local = module.bindings.get(name)
    if (local) {
      return { module, expression: local }
    }
    const imported = module.imports.get(name)
    if (!imported) {
      return undefined
    }
    const importedPath = RecipeExtractor.#resolveRecipeImport(module, imported.specifier, use)
    const importedModule = await this.#loadModule(importedPath)
    return this.#resolveBinding(importedModule, imported.importedName, use)
  }

  async #resolveExpression(
    module: RecipeModule,
    expression: ESTree.Expression,
    use: string,
  ): Promise<ResolvedExpression> {
    const current = unwrapExpression(expression)
    if (current.type === 'Identifier') {
      const resolved = await this.#resolveBinding(module, current.name, use)
      if (!resolved) {
        throw RecipeExtractor.#unsupported(module, use, current)
      }
      return this.#resolveExpression(resolved.module, resolved.expression, use)
    }
    return { module, expression: current }
  }

  async #resolveObject(
    module: RecipeModule,
    expression: ESTree.Expression,
    use: string,
  ): Promise<ResolvedExpression & { expression: ESTree.ObjectExpression }> {
    const resolved = await this.#resolveExpression(module, expression, use)
    if (resolved.expression.type !== 'ObjectExpression') {
      throw RecipeExtractor.#unsupported(resolved.module, use, resolved.expression)
    }
    return { module: resolved.module, expression: resolved.expression }
  }

  async #objectProperties(
    object: ResolvedExpression & { expression: ESTree.ObjectExpression },
    use: string,
    allowOverrides = false,
  ): Promise<Array<{ name: string; module: RecipeModule; value: ESTree.Expression }>> {
    const output: Array<{ name: string; module: RecipeModule; value: ESTree.Expression }> = []
    const names = new Set<string>()
    for (const entry of object.expression.properties) {
      if (entry.type === 'SpreadElement') {
        const spread = await this.#resolveObject(object.module, entry.argument, `${use} spread`)
        for (const property of await this.#objectProperties(spread, use, allowOverrides)) {
          if (names.has(property.name)) {
            if (!allowOverrides) {
              throw new Error(
                `[api-doc] Duplicate ${use} key "${property.name}" in ${object.module.filePath}.`,
              )
            }
            output[output.findIndex((item) => item.name === property.name)] = property
            continue
          }
          names.add(property.name)
          output.push(property)
        }
        continue
      }
      if (entry.type !== 'Property' || entry.kind !== 'init' || entry.method) {
        throw RecipeExtractor.#unsupported(object.module, use, entry)
      }
      const name = propertyName(entry)
      if (!name) {
        throw RecipeExtractor.#unsupported(object.module, use, entry)
      }
      if (names.has(name)) {
        if (!allowOverrides) {
          throw new Error(`[api-doc] Duplicate ${use} key "${name}" in ${object.module.filePath}.`)
        }
        output[output.findIndex((item) => item.name === name)] = {
          name,
          module: object.module,
          value: entry.value,
        }
        continue
      }
      names.add(name)
      output.push({ name, module: object.module, value: entry.value })
    }
    return output
  }

  async #extractSlots(
    config: ResolvedExpression & { expression: ESTree.ObjectExpression },
  ): Promise<string[]> {
    const properties = await this.#objectProperties(config, 'recipe config', true)
    const base = properties.find((property) => property.name === 'base')
    if (!base) {
      return []
    }
    const object = await this.#resolveObject(base.module, base.value, 'recipe base')
    return (await this.#objectProperties(object, 'recipe base', true)).map(
      (property) => property.name,
    )
  }

  async #extractVariants(
    config: ResolvedExpression & { expression: ESTree.ObjectExpression },
  ): Promise<RecipeVariantApi[]> {
    const configProperties = await this.#objectProperties(config, 'recipe config', true)
    const variantsProperty = configProperties.find((property) => property.name === 'variants')
    const defaultsProperty = configProperties.find(
      (property) => property.name === 'defaultVariants',
    )
    if (!variantsProperty) {
      return []
    }
    const defaults = new Map<string, DefaultValue>()
    if (defaultsProperty) {
      const defaultsObject = await this.#resolveObject(
        defaultsProperty.module,
        defaultsProperty.value,
        'defaultVariants',
      )
      for (const property of await this.#objectProperties(
        defaultsObject,
        'defaultVariants',
        true,
      )) {
        const value = literalDefault(property.value)
        if (value) {
          defaults.set(property.name, value)
        }
      }
    }

    const variantsObject = await this.#resolveObject(
      variantsProperty.module,
      variantsProperty.value,
      'variants',
    )
    const variants: RecipeVariantApi[] = []
    for (const variant of await this.#objectProperties(variantsObject, 'variants', true)) {
      const options = await this.#resolveObject(
        variant.module,
        variant.value,
        `variant "${variant.name}"`,
      )
      const optionNames = (
        await this.#objectProperties(options, `variant "${variant.name}"`, true)
      ).map((property) => property.name)
      const values: Array<string | number | boolean> =
        optionNames.length === 2 && optionNames.includes('true') && optionNames.includes('false')
          ? [true, false]
          : optionNames.map((option) => {
              const numeric = Number(option)
              return option !== '' && Number.isFinite(numeric) && String(numeric) === option
                ? numeric
                : option
            })
      variants.push({
        name: variant.name,
        values,
        ...(defaults.get(variant.name) ? { default: defaults.get(variant.name) } : {}),
      })
    }
    return variants
  }

  async #extractContract(
    module: RecipeModule,
    exportName: string,
  ): Promise<Array<{ target: string; attributes: string[] }>> {
    const binding = await this.#resolveBinding(module, exportName)
    if (!binding) {
      return []
    }
    const object = await this.#resolveObject(binding.module, binding.expression, exportName)
    const targets: Array<{ target: string; attributes: string[] }> = []
    for (const property of await this.#objectProperties(object, `${exportName} targets`)) {
      const names = await this.#extractContractMember(
        property.module,
        property.value,
        `${exportName}.${property.name}`,
      )
      targets.push({ target: property.name, attributes: names.sort((a, b) => a.localeCompare(b)) })
    }
    return targets
  }

  async #extractContractMember(
    module: RecipeModule,
    expression: ESTree.Expression,
    use: string,
  ): Promise<string[]> {
    const resolved = await this.#resolveExpression(module, expression, use)
    const current = resolved.expression
    if (current.type === 'MemberExpression' && !current.computed) {
      const member = getIdentifierName(current.property)
      if (!member || current.object.type !== 'Identifier') {
        throw RecipeExtractor.#unsupported(resolved.module, use, current)
      }
      const contract = await this.#resolveBinding(resolved.module, current.object.name, use)
      if (!contract) {
        throw RecipeExtractor.#unsupported(resolved.module, use, current)
      }
      const object = await this.#resolveObject(contract.module, contract.expression, use)
      const property = (await this.#objectProperties(object, `${use} source`)).find(
        (candidate) => candidate.name === member,
      )
      if (!property) {
        throw new Error(`[api-doc] Could not resolve ${use} from ${resolved.module.filePath}.`)
      }
      return this.#extractContractMember(property.module, property.value, use)
    }
    if (
      current.type !== 'CallExpression' ||
      current.callee.type !== 'Identifier' ||
      current.callee.name !== 'createDataAttributes' ||
      current.arguments.length === 0
    ) {
      throw RecipeExtractor.#unsupported(resolved.module, use, current)
    }
    const names = current.arguments.map((argument) => {
      if (
        argument.type === 'SpreadElement' ||
        argument.type !== 'Literal' ||
        typeof argument.value !== 'string' ||
        argument.value.startsWith('data-')
      ) {
        throw RecipeExtractor.#unsupported(resolved.module, use, current)
      }
      return argument.value
    })
    if (new Set(names).size !== names.length) {
      throw new Error(`[api-doc] Duplicate ${use} attribute name in ${resolved.module.filePath}.`)
    }
    return names
      .filter(
        (name) => name !== 'slot' && !name.startsWith('moraine-') && !name.startsWith('test-'),
      )
      .map((name) => `data-${name}`)
  }

  static #unsupported(module: RecipeModule, use: string, node: { type: string }): Error {
    return new Error(
      `[api-doc] Unsupported ${use} syntax (${node.type}) in ${module.filePath}. Restructure it as a shallow recipe contract.`,
    )
  }
}
