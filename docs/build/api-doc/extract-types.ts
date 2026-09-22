import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import type { ESTree } from 'vite'

import { entityNameToText, getIdentifierName, getJsDoc, nodeText, parseTypeScript } from './ast.ts'
import type { ParsedSource } from './ast.ts'
import type { RecipeVariantApi } from './recipe.ts'
import type { DefaultValue, GenericParameterApi, ItemApi, PropApi } from './types.ts'

export interface ParsedModule {
  filePath: string
  source: ParsedSource
  declarations: Map<string, ESTree.Declaration>
  namespaces: Map<string, ESTree.TSModuleDeclaration>
  imports: Map<string, { importedName: string; specifier: string }>
}

export class TypeExtractor {
  readonly #modules = new Map<string, ParsedModule>()
  readonly #indexedAccessStack = new Set<string>()
  #recipeVariants: RecipeVariantApi[] = []
  readonly projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async loadModule(filePath: string): Promise<ParsedModule | null> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.projectRoot, filePath)
    if (!absolutePath.endsWith('.types.ts') || !existsSync(absolutePath)) {
      return null
    }

    const cached = this.#modules.get(absolutePath)
    if (cached) {
      return cached
    }

    const content = readFileSync(absolutePath, 'utf8')
    const source = await parseTypeScript(absolutePath, content, 'ts')

    const declarations = new Map<string, ESTree.Declaration>()
    const namespaces = new Map<string, ESTree.TSModuleDeclaration>()
    const imports = new Map<string, { importedName: string; specifier: string }>()

    for (const stmt of source.program.body) {
      if (stmt.type === 'ImportDeclaration') {
        const specifier = stmt.source.value
        for (const spec of stmt.specifiers) {
          const local = getIdentifierName(spec.local)
          if (!local) {
            continue
          }
          const imported =
            spec.type === 'ImportSpecifier' ? (getIdentifierName(spec.imported) ?? local) : '*'
          imports.set(local, { importedName: imported, specifier })
        }
      } else if (stmt.type === 'ExportNamedDeclaration') {
        if (stmt.declaration) {
          TypeExtractor.#indexDeclaration(stmt.declaration, declarations, namespaces)
        }
        if (stmt.source?.value) {
          const specifier = stmt.source.value
          for (const spec of stmt.specifiers) {
            const local = getIdentifierName(spec.local)
            const exported = getIdentifierName(spec.exported) ?? local
            if (exported && local) {
              imports.set(exported, { importedName: local, specifier })
            }
          }
        }
      } else if (
        stmt.type === 'TSInterfaceDeclaration' ||
        stmt.type === 'TSTypeAliasDeclaration' ||
        stmt.type === 'TSModuleDeclaration'
      ) {
        TypeExtractor.#indexDeclaration(stmt, declarations, namespaces)
      }
    }

    const parsed: ParsedModule = {
      filePath: absolutePath,
      source,
      declarations,
      namespaces,
      imports,
    }

    this.#modules.set(absolutePath, parsed)
    return parsed
  }

  static #indexDeclaration(
    decl: ESTree.Declaration,
    declarations: Map<string, ESTree.Declaration>,
    namespaces: Map<string, ESTree.TSModuleDeclaration>,
  ) {
    if (
      decl.type === 'TSModuleDeclaration' &&
      'kind' in decl &&
      decl.kind !== 'global' &&
      decl.id.type === 'Identifier'
    ) {
      namespaces.set(decl.id.name, decl)
    } else if ('id' in decl && decl.id && decl.id.type === 'Identifier') {
      declarations.set(decl.id.name, decl)
    }
  }

  async resolveSymbol(
    fromModule: ParsedModule,
    name: string,
    fromNamespace?: ESTree.TSModuleDeclaration,
  ): Promise<{
    module: ParsedModule
    node: ESTree.Declaration
    nsNode?: ESTree.TSModuleDeclaration
  } | null> {
    // 1. Check inside current namespace if provided
    if (fromNamespace && fromNamespace.body?.type === 'TSModuleBlock') {
      for (const stmt of fromNamespace.body.body) {
        const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt
        if (decl && 'id' in decl && getIdentifierName(decl.id) === name) {
          return { module: fromModule, node: decl as ESTree.Declaration, nsNode: fromNamespace }
        }
      }
    }

    // 2. Handle qualified names like ModalT.Base or BaseSelectT.Item
    if (name.includes('.')) {
      const dotIndex = name.indexOf('.')
      const nsName = name.slice(0, dotIndex)
      const memberName = name.slice(dotIndex + 1)
      const ns = await this.resolveNamespace(fromModule, nsName)
      if (ns && ns.node.body?.type === 'TSModuleBlock') {
        for (const stmt of ns.node.body.body) {
          const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt
          if (decl && 'id' in decl && getIdentifierName(decl.id) === memberName) {
            return { module: ns.module, node: decl as ESTree.Declaration, nsNode: ns.node }
          }
        }
      }
      return null
    }

    // 3. Module-level declarations
    if (fromModule.declarations.has(name)) {
      return { module: fromModule, node: fromModule.declarations.get(name)! }
    }

    // 4. Imports
    const imp = fromModule.imports.get(name)
    if (!imp) {
      return null
    }

    const targetPath = this.#resolveSpecifier(fromModule.filePath, imp.specifier)
    if (!targetPath) {
      return null
    }

    const targetModule = await this.loadModule(targetPath)
    if (!targetModule) {
      return null
    }

    return this.resolveSymbol(targetModule, imp.importedName)
  }

  async resolveNamespace(
    fromModule: ParsedModule,
    name: string,
  ): Promise<{ module: ParsedModule; node: ESTree.TSModuleDeclaration } | null> {
    if (fromModule.namespaces.has(name)) {
      return { module: fromModule, node: fromModule.namespaces.get(name)! }
    }

    const imp = fromModule.imports.get(name)
    if (!imp) {
      return null
    }

    const targetPath = this.#resolveSpecifier(fromModule.filePath, imp.specifier)
    if (!targetPath) {
      return null
    }

    const targetModule = await this.loadModule(targetPath)
    if (!targetModule) {
      return null
    }

    return this.resolveNamespace(targetModule, imp.importedName)
  }

  #resolveSpecifier(importerPath: string, specifier: string): string | null {
    const tryCandidates = (basePath: string): string | null => {
      const candidates = [`${basePath}.types.ts`, `${basePath}.ts`, basePath]
      for (const candidate of candidates) {
        if (candidate.endsWith('.types.ts') && existsSync(candidate)) {
          try {
            if (statSync(candidate).isFile()) {
              return candidate
            }
          } catch {
            // ignore
          }
        }
      }
      return null
    }

    if (specifier.startsWith('.')) {
      const dir = path.dirname(importerPath)
      const direct = path.resolve(dir, specifier)
      return tryCandidates(direct)
    } else if (specifier.startsWith('@src/')) {
      const rel = specifier.slice('@src/'.length)
      const direct = path.resolve(this.projectRoot, 'src', rel)
      return tryCandidates(direct)
    }
    return null
  }

  async extractKind(module: ParsedModule, namespaceName: string): Promise<'single' | 'composite'> {
    const ns = await this.resolveNamespace(module, namespaceName)
    if (!ns || !ns.node.body || ns.node.body.type !== 'TSModuleBlock') {
      return 'single'
    }

    for (const stmt of ns.node.body.body) {
      const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt
      if (
        decl?.type === 'TSTypeAliasDeclaration' &&
        decl.id.name === 'Kind' &&
        decl.typeAnnotation.type === 'TSLiteralType'
      ) {
        const val = (decl.typeAnnotation.literal as { value?: unknown }).value
        if (val === 'composite') {
          return 'composite'
        }
        if (val === 'single') {
          return 'single'
        }
      }
    }

    return 'single'
  }

  async extractItem(module: ParsedModule, namespaceName: string): Promise<ItemApi | undefined> {
    const ns = await this.resolveNamespace(module, namespaceName)
    if (!ns || !ns.node.body || ns.node.body.type !== 'TSModuleBlock') {
      return undefined
    }

    let itemDecl: ESTree.Declaration | null = null
    for (const stmt of ns.node.body.body) {
      const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt
      if (
        (decl?.type === 'TSInterfaceDeclaration' || decl?.type === 'TSTypeAliasDeclaration') &&
        decl.id.name === 'Item'
      ) {
        itemDecl = decl
        break
      }
    }

    if (!itemDecl) {
      return undefined
    }

    const generics = TypeExtractor.#extractGenericParameters(
      (itemDecl as { typeParameters?: ESTree.TSTypeParameterDeclaration }).typeParameters,
    )
    const props = await this.#resolvePropertiesFromDeclaration(ns.module, itemDecl, ns.node)

    const jsdoc = getJsDoc(ns.module.source, itemDecl)
    return {
      ...(jsdoc.description ? { description: jsdoc.description } : {}),
      ...(generics.length > 0 ? { generics } : {}),
      props,
    }
  }

  async extractPart(
    module: ParsedModule,
    namespaceName: string,
    propsTypeName: string,
    partName: string,
    isRoot: boolean,
    recipeVariants: RecipeVariantApi[] = [],
  ): Promise<{
    generics: GenericParameterApi[]
    defaultElement?: string
    props: PropApi[]
    description?: string
  }> {
    this.#recipeVariants = recipeVariants
    const ns = await this.resolveNamespace(module, namespaceName)
    if (!ns || !ns.node.body || ns.node.body.type !== 'TSModuleBlock') {
      return { generics: [], props: [] }
    }

    let targetDecl: ESTree.Declaration | null = null
    for (const stmt of ns.node.body.body) {
      const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt
      if (
        (decl?.type === 'TSInterfaceDeclaration' || decl?.type === 'TSTypeAliasDeclaration') &&
        decl.id.name === propsTypeName
      ) {
        targetDecl = decl
        break
      }
    }

    if (!targetDecl && isRoot && propsTypeName !== 'Props') {
      for (const stmt of ns.node.body.body) {
        const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : stmt
        if (
          (decl?.type === 'TSInterfaceDeclaration' || decl?.type === 'TSTypeAliasDeclaration') &&
          decl.id.name === 'Props'
        ) {
          targetDecl = decl
          break
        }
      }
    }

    if (!targetDecl) {
      const topDecl =
        module.declarations.get(propsTypeName) ??
        (isRoot ? module.declarations.get(`${namespaceName.replace(/T$/, '')}Props`) : null)
      if (topDecl) {
        targetDecl = topDecl
      }
    }

    if (!targetDecl) {
      return { generics: [], props: [] }
    }

    const jsdoc = getJsDoc(ns.module.source, targetDecl)
    let generics = TypeExtractor.#extractGenericParameters(
      (targetDecl as { typeParameters?: ESTree.TSTypeParameterDeclaration }).typeParameters,
    )

    let defaultElement: string | undefined
    let props: PropApi[]

    if (
      targetDecl.type === 'TSTypeAliasDeclaration' &&
      targetDecl.typeAnnotation.type === 'TSTypeReference' &&
      entityNameToText(targetDecl.typeAnnotation.typeName) === 'BaseProps'
    ) {
      const basePropsRes = await this.#handleBaseProps(
        ns.module,
        ns.node,
        targetDecl.typeAnnotation,
        generics,
      )
      props = basePropsRes.props
      defaultElement = basePropsRes.defaultElement
      if (basePropsRes.generics) {
        generics = basePropsRes.generics
      }
    } else {
      // Check if targetDecl is a type alias pointing directly to BaseProps or an interface extending Base
      props = await this.#resolvePropertiesFromDeclaration(ns.module, targetDecl, ns.node)

      if (targetDecl.type === 'TSTypeAliasDeclaration') {
        const typeAnn = targetDecl.typeAnnotation
        if (typeAnn.type === 'TSTypeReference') {
          const refName = entityNameToText(typeAnn.typeName)
          if (refName) {
            const sym = await this.resolveSymbol(ns.module, refName, ns.node)
            if (sym && sym.node.type === 'TSTypeAliasDeclaration') {
              if (
                sym.node.typeAnnotation.type === 'TSTypeReference' &&
                entityNameToText(sym.node.typeAnnotation.typeName) === 'BaseProps'
              ) {
                const basePropsRes = await this.#handleBaseProps(
                  sym.module,
                  ns.node,
                  sym.node.typeAnnotation,
                  generics,
                )
                props = basePropsRes.props
                defaultElement = basePropsRes.defaultElement
                if (basePropsRes.generics) {
                  generics = basePropsRes.generics
                }
              }
            }
          }
        }
      }
    }

    return {
      generics,
      ...(defaultElement ? { defaultElement } : {}),
      props,
      ...(jsdoc.description ? { description: jsdoc.description } : {}),
    }
  }

  async #handleBaseProps(
    module: ParsedModule,
    nsNode: ESTree.TSModuleDeclaration | undefined,
    typeRef: ESTree.TSTypeReference,
    existingGenerics: GenericParameterApi[],
    substitutions?: Map<string, string>,
  ): Promise<{
    props: PropApi[]
    defaultElement: string
    generics?: GenericParameterApi[]
  }> {
    const args = typeRef.typeArguments?.params ?? []
    const tElementNode = args[0]
    const baseNode = args[1]
    const variantNode = args[2]
    const classesNode = args[3]
    const stylesNode = args[4]
    const tDefaultNode = args[5]

    let defaultElement: string | undefined
    let isPolymorphic = false
    let asGenericParam: GenericParameterApi | undefined

    if (tDefaultNode && tDefaultNode.type === 'TSLiteralType') {
      defaultElement = String((tDefaultNode.literal as { value?: unknown }).value)
    } else if (tElementNode && tElementNode.type === 'TSLiteralType') {
      defaultElement = String((tElementNode.literal as { value?: unknown }).value)
    }

    if (tElementNode && tElementNode.type === 'TSTypeReference') {
      const typeParamName = entityNameToText(tElementNode.typeName)
      const matched = existingGenerics.find((g) => g.name === typeParamName)
      if (matched) {
        isPolymorphic = true
        asGenericParam = matched
        if (!defaultElement && matched.default) {
          defaultElement = matched.default.replace(/['"]/g, '')
        }
      }
    }

    if (!defaultElement) {
      throw new Error(
        `[api-doc] BaseProps in ${module.filePath} must declare a literal element or a generic default.`,
      )
    }

    const props: PropApi[] = []

    // 1. Resolve Base props
    if (baseNode) {
      const baseProps = await this.#resolvePropertiesFromType(
        module,
        nsNode,
        baseNode,
        substitutions,
      )
      props.push(...baseProps)
    }

    // 2. Synthesize variant props from the colocated recipe metadata.
    if (variantNode && !(await this.#isNeverType(module, nsNode, variantNode))) {
      for (const variant of this.#recipeVariants) {
        const typeText = variant.values.every((value) => typeof value === 'boolean')
          ? 'boolean'
          : variant.values
              .map((value) => (typeof value === 'string' ? `'${value}'` : String(value)))
              .join(' | ')
        const variantProp: PropApi = {
          name: variant.name,
          optional: true,
          type: typeText,
          ...(variant.default ? { default: variant.default } : {}),
        }
        const existingIdx = props.findIndex((prop) => prop.name === variant.name)
        if (existingIdx >= 0) {
          props[existingIdx] = variantProp
        } else {
          props.push(variantProp)
        }
      }
    }

    // 3. Add class & style props
    if (!props.some((p) => p.name === 'class')) {
      props.push({
        name: 'class',
        optional: true,
        type: 'SlotClassValue',
        description: 'Class applied to the component root or trigger element.',
      })
    }

    if (!props.some((p) => p.name === 'style')) {
      props.push({
        name: 'style',
        optional: true,
        type: 'SlotStyleValue',
        description: 'Style applied to the component root or trigger element.',
      })
    }

    // 4. Add classes & styles if not never
    if (classesNode && !(await this.#isNeverType(module, nsNode, classesNode))) {
      const classesText = TypeExtractor.#formatTypeText(module.source, classesNode)
      if (!props.some((p) => p.name === 'classes')) {
        props.push({
          name: 'classes',
          optional: true,
          type: classesText,
          description: 'Family slot class defaults for this instance.',
        })
      }
    }

    if (stylesNode && !(await this.#isNeverType(module, nsNode, stylesNode))) {
      const stylesText = TypeExtractor.#formatTypeText(module.source, stylesNode)
      if (!props.some((p) => p.name === 'styles')) {
        props.push({
          name: 'styles',
          optional: true,
          type: stylesText,
          description: 'Family slot style defaults for this instance.',
        })
      }
    }

    // 5. If polymorphic, ensure `as` prop exists
    if (isPolymorphic && asGenericParam) {
      const existingAs = props.find((p) => p.name === 'as')
      if (existingAs) {
        if (!existingAs.default && defaultElement) {
          existingAs.default = { kind: 'literal', value: defaultElement }
        }
      } else {
        props.unshift({
          name: 'as',
          optional: true,
          type: asGenericParam.name,
          ...(defaultElement ? { default: { kind: 'literal', value: defaultElement } } : {}),
          description: 'Element or component to render as.',
        })
      }
    }

    return { props, defaultElement }
  }

  async #isNeverType(
    module: ParsedModule,
    nsNode: ESTree.TSModuleDeclaration | undefined,
    node?: ESTree.TSType,
  ): Promise<boolean> {
    if (!node) {
      return true
    }
    if (node.type === 'TSNeverKeyword') {
      return true
    }
    if (node.type === 'TSTypeReference') {
      const name = entityNameToText(node.typeName)
      if (name) {
        const sym = await this.resolveSymbol(module, name, nsNode)
        if (sym && sym.node.type === 'TSTypeAliasDeclaration') {
          return this.#isNeverType(
            sym.module,
            sym.nsNode ?? (sym.module === module ? nsNode : undefined),
            sym.node.typeAnnotation,
          )
        }
      }
    }
    return false
  }

  async #resolvePropertiesFromType(
    module: ParsedModule,
    nsNode: ESTree.TSModuleDeclaration | undefined,
    node: ESTree.TSType,
    substitutions?: Map<string, string>,
  ): Promise<PropApi[]> {
    return this.#resolvePropertiesFromTypeNode(module, node, nsNode, substitutions)
  }

  static #mergeProperties(target: PropApi[], incoming: readonly PropApi[]): void {
    for (const property of incoming) {
      const index = target.findIndex((candidate) => candidate.name === property.name)
      if (index >= 0) {
        target[index] = property
      } else {
        target.push(property)
      }
    }
  }

  async #resolveMappedProperties(
    kind: 'Omit' | 'Pick',
    module: ParsedModule,
    target: ESTree.TSType,
    keysNode: ESTree.TSType,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<PropApi[]> {
    const keys = TypeExtractor.#extractStringLiteralUnion(keysNode)
    const properties = await this.#resolvePropertiesFromTypeNode(
      module,
      target,
      nsNode,
      substitutions,
    )
    return properties.filter((property) => (kind === 'Pick') === keys.has(property.name))
  }

  async #resolveTypeArguments(
    module: ParsedModule,
    nsNode: ESTree.TSModuleDeclaration | undefined,
    declaration: ESTree.Declaration,
    typeArguments: readonly ESTree.TSType[],
    substitutions?: Map<string, string>,
    applyDefaults = true,
  ): Promise<Map<string, string> | undefined> {
    const parameters = (declaration as { typeParameters?: ESTree.TSTypeParameterDeclaration })
      .typeParameters?.params
    if (!parameters?.length) {
      return substitutions ? new Map(substitutions) : undefined
    }

    const resolved = new Map(substitutions)
    for (let index = 0; index < parameters.length; index++) {
      const parameter = parameters[index]
      const argument = typeArguments[index] ?? (applyDefaults ? parameter?.default : undefined)
      if (!parameter || !argument) {
        continue
      }
      const parameterName =
        typeof parameter.name === 'string'
          ? parameter.name
          : (getIdentifierName(parameter.name) ?? '')
      let formattedArgument = TypeExtractor.#formatTypeText(module.source, argument)
      if (substitutions?.has(formattedArgument)) {
        formattedArgument = substitutions.get(formattedArgument)!
      } else {
        const alias = await this.resolveSymbol(module, formattedArgument, nsNode)
        if (alias?.node.type === 'TSTypeAliasDeclaration') {
          formattedArgument = TypeExtractor.#formatTypeText(
            alias.module.source,
            alias.node.typeAnnotation,
          )
        }
      }
      resolved.set(parameterName, formattedArgument)
    }
    return resolved
  }

  async #resolvePropertiesFromDeclaration(
    module: ParsedModule,
    decl: ESTree.Declaration,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<PropApi[]> {
    const props: PropApi[] = []

    if (decl.type === 'TSInterfaceDeclaration') {
      if (decl.extends) {
        for (const heritage of decl.extends) {
          const heritageType = heritage.expression
          const name = entityNameToText(heritageType)
          const heritageWithArguments = heritage as typeof heritage & {
            typeParameters?: ESTree.TSTypeParameterInstantiation
            typeArguments?: ESTree.TSTypeParameterInstantiation
          }
          const typeArgs =
            heritageWithArguments.typeParameters?.params ??
            heritageWithArguments.typeArguments?.params ??
            []
          if (name) {
            if (name === 'Omit' && typeArgs.length === 2) {
              TypeExtractor.#mergeProperties(
                props,
                await this.#resolveMappedProperties(
                  'Omit',
                  module,
                  typeArgs[0]!,
                  typeArgs[1]!,
                  nsNode,
                  substitutions,
                ),
              )
            } else if (name === 'Pick' && typeArgs.length === 2) {
              TypeExtractor.#mergeProperties(
                props,
                await this.#resolveMappedProperties(
                  'Pick',
                  module,
                  typeArgs[0]!,
                  typeArgs[1]!,
                  nsNode,
                  substitutions,
                ),
              )
            } else {
              const sym = await this.resolveSymbol(module, name, nsNode)
              if (sym) {
                const childSubstitutions = await this.#resolveTypeArguments(
                  module,
                  nsNode,
                  sym.node,
                  typeArgs,
                  substitutions,
                  false,
                )
                const inherited = await this.#resolvePropertiesFromDeclaration(
                  sym.module,
                  sym.node,
                  sym.nsNode ?? (sym.module === module ? nsNode : undefined),
                  childSubstitutions,
                )
                TypeExtractor.#mergeProperties(props, inherited)
              }
            }
          }
        }
      }

      for (const member of decl.body.body) {
        if (member.type === 'TSPropertySignature') {
          const prop = await this.#convertPropertySignature(module, member, nsNode, substitutions)
          if (prop) {
            TypeExtractor.#mergeProperties(props, [prop])
          }
        }
      }
    } else if (decl.type === 'TSTypeAliasDeclaration') {
      const typeAnn = decl.typeAnnotation
      if (typeAnn.type === 'TSTypeLiteral') {
        props.push(
          ...(await this.#extractPropertiesFromTypeLiteral(module, typeAnn, nsNode, substitutions)),
        )
      } else if (typeAnn.type === 'TSIntersectionType') {
        for (const t of typeAnn.types) {
          props.push(
            ...(await this.#resolvePropertiesFromTypeNode(module, t, nsNode, substitutions)),
          )
        }
      } else if (typeAnn.type === 'TSTypeReference') {
        props.push(
          ...(await this.#resolvePropertiesFromTypeNode(module, typeAnn, nsNode, substitutions)),
        )
      }
    }

    return props
  }

  async #resolvePropertiesFromTypeNode(
    module: ParsedModule,
    node: ESTree.TSType,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<PropApi[]> {
    if (node.type === 'TSTypeLiteral') {
      return this.#extractPropertiesFromTypeLiteral(module, node, nsNode, substitutions)
    }
    if (node.type === 'TSIntersectionType') {
      const res: PropApi[] = []
      for (const t of node.types) {
        res.push(...(await this.#resolvePropertiesFromTypeNode(module, t, nsNode, substitutions)))
      }
      return res
    }
    if (node.type === 'TSTypeReference') {
      const name = entityNameToText(node.typeName)
      if (!name) {
        return []
      }
      if (name === 'BaseProps') {
        const basePropsRes = await this.#handleBaseProps(module, nsNode, node, [], substitutions)
        return basePropsRes.props
      }
      if (name === 'Omit' && node.typeArguments?.params.length === 2) {
        return this.#resolveMappedProperties(
          'Omit',
          module,
          node.typeArguments.params[0]!,
          node.typeArguments.params[1]!,
          nsNode,
          substitutions,
        )
      }
      if (name === 'Pick' && node.typeArguments?.params.length === 2) {
        return this.#resolveMappedProperties(
          'Pick',
          module,
          node.typeArguments.params[0]!,
          node.typeArguments.params[1]!,
          nsNode,
          substitutions,
        )
      }
      if ((name === 'Partial' || name === 'Required') && node.typeArguments?.params.length === 1) {
        const targetType = node.typeArguments.params[0]!
        const targetProps = await this.#resolvePropertiesFromTypeNode(
          module,
          targetType,
          nsNode,
          substitutions,
        )
        return targetProps.map((p) => Object.assign({}, p, { optional: name === 'Partial' }))
      }

      const sym = await this.resolveSymbol(module, name, nsNode)
      if (sym) {
        const typeArgs = node.typeArguments?.params ?? []
        const childSubstitutions = await this.#resolveTypeArguments(
          module,
          nsNode,
          sym.node,
          typeArgs,
          substitutions,
        )
        return this.#resolvePropertiesFromDeclaration(
          sym.module,
          sym.node,
          sym.nsNode ?? (sym.module === module ? nsNode : undefined),
          childSubstitutions,
        )
      }
    }
    return []
  }

  async #extractPropertiesFromTypeLiteral(
    module: ParsedModule,
    literal: ESTree.TSTypeLiteral,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<PropApi[]> {
    const props: PropApi[] = []
    for (const member of literal.members) {
      if (member.type === 'TSPropertySignature') {
        const prop = await this.#convertPropertySignature(module, member, nsNode, substitutions)
        if (prop) {
          props.push(prop)
        }
      }
    }
    return props
  }

  async #convertPropertySignature(
    module: ParsedModule,
    sig: ESTree.TSPropertySignature,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<PropApi | null> {
    const name = getIdentifierName(sig.key)
    if (!name) {
      return null
    }

    const optional = sig.optional === true
    let typeText = sig.typeAnnotation
      ? await this.#resolveTypeText(
          module,
          sig.typeAnnotation.typeAnnotation,
          nsNode,
          substitutions,
        )
      : 'unknown'

    if (substitutions && substitutions.size > 0) {
      for (const [paramName, replacement] of substitutions) {
        typeText = typeText.replace(new RegExp(`\\b${paramName}\\b`, 'g'), replacement)
      }
    }

    const jsdoc = getJsDoc(module.source, sig)
    const defaultValue =
      jsdoc.defaultValue !== undefined
        ? TypeExtractor.#parseDefaultValue(jsdoc.defaultValue)
        : undefined
    return {
      name,
      optional,
      type: typeText,
      ...(jsdoc.description ? { description: jsdoc.description } : {}),
      ...(defaultValue ? { default: defaultValue } : {}),
    }
  }

  async #resolveTypeText(
    module: ParsedModule,
    node: ESTree.TSType,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<string> {
    if (node.type === 'TSIndexedAccessType') {
      const resolved = await this.#resolveIndexedAccessType(module, node, nsNode, substitutions)
      if (resolved) {
        return resolved
      }
    }

    if (node.type === 'TSUnionType') {
      const parts = await Promise.all(
        node.types.map((t) => this.#resolveTypeText(module, t, nsNode, substitutions)),
      )
      return parts.join(' | ')
    }

    if (node.type === 'TSIntersectionType') {
      const parts = await Promise.all(
        node.types.map((t) => this.#resolveTypeText(module, t, nsNode, substitutions)),
      )
      return parts.join(' & ')
    }

    if (node.type === 'TSArrayType') {
      const inner = await this.#resolveTypeText(module, node.elementType, nsNode, substitutions)
      return `${inner}[]`
    }

    if (node.type === 'TSParenthesizedType') {
      const inner = await this.#resolveTypeText(module, node.typeAnnotation, nsNode, substitutions)
      return `(${inner})`
    }

    return TypeExtractor.#formatTypeText(module.source, node)
  }

  async #resolveIndexedAccessType(
    module: ParsedModule,
    node: ESTree.TSIndexedAccessType,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<string | null> {
    const rawKey = `${module.filePath}:${nodeText(module.source, node)}`
    if (this.#indexedAccessStack.has(rawKey)) {
      return null
    }
    this.#indexedAccessStack.add(rawKey)
    try {
      if (node.indexType.type === 'TSUnionType') {
        const results: string[] = []
        for (const t of node.indexType.types) {
          const sub = await this.#resolveIndexedAccessType(
            module,
            { ...node, indexType: t },
            nsNode,
            substitutions,
          )
          if (sub) {
            results.push(sub)
          }
        }
        if (results.length > 0) {
          return results.join(' | ')
        }
      }

      let indexName: string | undefined
      if (
        node.indexType.type === 'TSLiteralType' &&
        typeof (node.indexType.literal as { value?: unknown }).value === 'string'
      ) {
        indexName = (node.indexType.literal as { value: string }).value
      }
      if (!indexName) {
        return null
      }

      const props = await this.#resolvePropertiesFromTypeNode(
        module,
        node.objectType,
        nsNode,
        substitutions,
      )
      const targetProp = props.find((p) => p.name === indexName)
      if (targetProp) {
        return targetProp.type
      }

      return null
    } finally {
      this.#indexedAccessStack.delete(rawKey)
    }
  }

  static #parseDefaultValue(raw: string): DefaultValue {
    const trimmed = raw.trim()
    if (trimmed === "''" || trimmed === '""') {
      return { kind: 'literal', value: '' }
    }
    if (
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      return { kind: 'literal', value: trimmed.slice(1, -1) }
    }
    if (trimmed === 'false') {
      return { kind: 'literal', value: false }
    }
    if (trimmed === 'true') {
      return { kind: 'literal', value: true }
    }
    if (trimmed === 'null') {
      return { kind: 'literal', value: null }
    }
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return { kind: 'literal', value: Number(trimmed) }
    }

    return { kind: 'expression', text: trimmed }
  }

  static #formatTypeText(source: ParsedSource, node: ESTree.TSType): string {
    const raw = nodeText(source, node).trim()
    const normalized = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*\|\s*/g, ' | ')
      .replace(/\s*&\s*/g, ' & ')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/{\s+/g, '{ ')
      .replace(/\s+}/g, ' }')
      .replaceAll('cls_variant0.', '')
      .replaceAll('_$', '')

    return normalized
  }

  static #extractStringLiteralUnion(node: ESTree.TSType): Set<string> {
    const set = new Set<string>()
    if (
      node.type === 'TSLiteralType' &&
      typeof (node.literal as { value?: unknown }).value === 'string'
    ) {
      set.add((node.literal as { value: string }).value)
    } else if (node.type === 'TSUnionType') {
      for (const t of node.types) {
        if (
          t.type === 'TSLiteralType' &&
          typeof (t.literal as { value?: unknown }).value === 'string'
        ) {
          set.add((t.literal as { value: string }).value)
        }
      }
    }
    return set
  }

  static #extractGenericParameters(
    decl?: ESTree.TSTypeParameterDeclaration,
  ): GenericParameterApi[] {
    if (!decl || !decl.params) {
      return []
    }

    return decl.params.map((param) => {
      const name = param.name.name
      const constraint = param.constraint
        ? TypeExtractor.#formatTypeParameter(param.constraint)
        : undefined
      const defaultType = param.default
        ? TypeExtractor.#formatTypeParameter(param.default)
        : undefined
      return {
        name,
        ...(constraint ? { constraint } : {}),
        ...(defaultType ? { default: defaultType } : {}),
      }
    })
  }

  static #formatTypeParameter(node: ESTree.TSType): string {
    if (node.type === 'TSTypeReference') {
      const name = entityNameToText(node.typeName)
      if (node.typeArguments?.params.length) {
        const args = node.typeArguments.params
          .map((p) => TypeExtractor.#formatTypeParameter(p))
          .join(', ')
        return `${name}<${args}>`
      }
      return name ?? 'unknown'
    }
    if (node.type === 'TSLiteralType') {
      const val = (node.literal as { value?: unknown }).value
      return typeof val === 'string' ? `'${val}'` : String(val)
    }
    if (node.type === 'TSUnionType') {
      return node.types.map((t) => TypeExtractor.#formatTypeParameter(t)).join(' | ')
    }
    if (node.type === 'TSStringKeyword') {
      return 'string'
    }
    if (node.type === 'TSNumberKeyword') {
      return 'number'
    }
    if (node.type === 'TSBooleanKeyword') {
      return 'boolean'
    }
    return 'unknown'
  }
}
