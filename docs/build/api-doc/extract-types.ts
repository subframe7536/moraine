import { existsSync, readFileSync, statSync } from 'node:fs'

import path from 'pathe'
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

interface TypeBinding {
  bindings?: Map<string, TypeBinding>
  module: ParsedModule
  node: ESTree.TSType
  namespace?: ESTree.TSModuleDeclaration
}

function isStyleTypeModule(filePath: string): boolean {
  const normalized = path.normalize(filePath)
  return normalized.endsWith('.style-types.ts') || normalized.endsWith('/theme/style-types.ts')
}

const NATIVE_PROP_DESCRIPTIONS: Record<string, string> = {
  children: 'Content rendered inside the element.',
  as: 'Element or component to render as.',
  id: 'Unique identifier applied to the rendered element.',
  ref: 'Ref forwarded to the rendered element.',
}

function isFiniteStyleAlias(node: ESTree.TSType): boolean {
  if (node.type === 'TSParenthesizedType') {
    return isFiniteStyleAlias(node.typeAnnotation)
  }
  if (node.type === 'TSUnionType') {
    return node.types.every(isFiniteStyleAlias)
  }
  return node.type === 'TSLiteralType' || node.type === 'TSTypeReference'
}

export class TypeExtractor {
  readonly #modules = new Map<string, ParsedModule>()
  readonly #indexedAccessStack = new Set<string>()
  #recipeVariants: Array<RecipeVariantApi> = []
  #expandingCollection = false
  #genericBindings = new Map<string, TypeBinding>()
  readonly projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async loadModule(filePath: string): Promise<ParsedModule | null> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.projectRoot, filePath)
    if (!absolutePath.endsWith('.ts') || !existsSync(absolutePath)) {
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

    // 2. Handle qualified names like BaseDialogT.Base or BaseSelectT.Item
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
    const declaration = fromModule.declarations.get(name)
    if (declaration) {
      return { module: fromModule, node: declaration }
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
    const namespace = fromModule.namespaces.get(name)
    if (namespace) {
      return { module: fromModule, node: namespace }
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

  static #tryCandidates(basePath: string): string | null {
    const candidates = [
      basePath,
      `${basePath}.ts`,
      `${basePath}.types.ts`,
      path.join(basePath, 'index.ts'),
    ]
    for (const candidate of candidates) {
      if (candidate.endsWith('.ts') && existsSync(candidate)) {
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

  #resolveSpecifier(importerPath: string, specifier: string): string | null {
    if (specifier.startsWith('.')) {
      const dir = path.dirname(importerPath)
      const direct = path.resolve(dir, specifier)
      return TypeExtractor.#tryCandidates(direct)
    } else if (specifier.startsWith('@src/')) {
      const rel = specifier.slice('@src/'.length)
      const direct = path.resolve(this.projectRoot, 'src', rel)
      return TypeExtractor.#tryCandidates(direct)
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
    isRoot: boolean,
    recipeVariants: Array<RecipeVariantApi> = [],
  ): Promise<{
    generics: Array<GenericParameterApi>
    defaultElement?: string
    props: Array<PropApi>
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

    this.#genericBindings = new Map()
    const parameters =
      (targetDecl as { typeParameters?: ESTree.TSTypeParameterDeclaration }).typeParameters
        ?.params ?? []
    for (const parameter of parameters) {
      const node = parameter.default ?? parameter.constraint
      if (node) {
        this.#genericBindings.set(
          typeof parameter.name === 'string'
            ? parameter.name
            : (getIdentifierName(parameter.name) ?? ''),
          { module: ns.module, node, namespace: ns.node },
        )
      }
    }

    let defaultElement: string | undefined
    let props: Array<PropApi>

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
        if (typeAnn.type === 'TSIntersectionType') {
          for (const type of typeAnn.types) {
            if (
              type.type === 'TSTypeReference' &&
              entityNameToText(type.typeName) === 'BaseProps'
            ) {
              const baseProps = await this.#handleBaseProps(ns.module, ns.node, type, generics)
              defaultElement = baseProps.defaultElement
              break
            }
          }
        }
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
                  sym.nsNode,
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
    existingGenerics: Array<GenericParameterApi>,
    substitutions?: Map<string, string>,
  ): Promise<{
    props: Array<PropApi>
    defaultElement?: string
    generics?: Array<GenericParameterApi>
  }> {
    const args = typeRef.typeArguments?.params ?? []
    const tElementNode = args[0]
    const baseNode = args[1]
    const variantNode = args[2]
    const classesNode = args[3]
    const stylesNode = args[4]
    const tDefaultNode = args[5]
    const acceptsChildrenNode = args[6]

    let defaultElement: string | undefined

    if (tDefaultNode && tDefaultNode.type === 'TSLiteralType') {
      defaultElement = String((tDefaultNode.literal as { value?: unknown }).value)
    } else if (tElementNode && tElementNode.type === 'TSLiteralType') {
      defaultElement = String((tElementNode.literal as { value?: unknown }).value)
    }

    if (tElementNode && tElementNode.type === 'TSTypeReference') {
      const typeParamName = entityNameToText(tElementNode.typeName)
      const matched = existingGenerics.find((g) => g.name === typeParamName)
      if (matched) {
        if (!defaultElement && matched.default) {
          defaultElement = matched.default.replaceAll(/['"]/g, '')
        }
      }
    }

    if (!defaultElement && tElementNode?.type !== 'TSNeverKeyword') {
      throw new Error(
        `[api-doc] BaseProps in ${module.filePath} must declare a literal element or a generic default.`,
      )
    }

    const props: Array<PropApi> = []

    // 1. Resolve Base props
    if (baseNode) {
      const baseProps = await this.#resolvePropertiesFromTypeNode(
        module,
        baseNode,
        nsNode,
        substitutions,
      )
      props.push(...baseProps)
    }

    // `AcceptsChildren = true` enables children that `Base` does not declare (for example on
    // `FlowComponent` parts), so document them explicitly.
    if (
      acceptsChildrenNode?.type === 'TSLiteralType' &&
      (acceptsChildrenNode.literal as { value?: unknown }).value === true &&
      !props.some((prop) => prop.name === 'children')
    ) {
      props.push({ name: 'children', optional: true, type: 'JSX.Element' })
    }

    // Public types define the variants; recipes only supply missing defaults.
    if (variantNode) {
      const variants = await this.#resolvePropertiesFromTypeNode(
        module,
        variantNode,
        nsNode,
        substitutions,
      )
      for (const variant of variants) {
        const existing = props.find((prop) => prop.name === variant.name)
        if (existing) {
          continue
        }
        const recipeDefault = this.#recipeVariants.find(
          (entry) => entry.name === variant.name,
        )?.default
        props.push({
          ...variant,
          ...(variant.default || !recipeDefault ? {} : { default: recipeDefault }),
        })
      }
    }

    // 3. Add class & style props (headless roots with never element omit class & style)
    if (tElementNode?.type !== 'TSNeverKeyword') {
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

    const asProp = props.find((prop) => prop.name === 'as')
    if (asProp && !asProp.default && defaultElement) {
      asProp.default = { kind: 'literal', value: defaultElement }
    }

    for (const prop of props) {
      prop.description ??= NATIVE_PROP_DESCRIPTIONS[prop.name]
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

  static #mergeProperties(target: Array<PropApi>, incoming: ReadonlyArray<PropApi>): void {
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
  ): Promise<Array<PropApi>> {
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
    declarationModule: ParsedModule,
    typeArguments: ReadonlyArray<ESTree.TSType>,
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
      const explicit = typeArguments[index]
      const argument = explicit ?? (applyDefaults ? parameter?.default : undefined)
      if (!parameter || !argument) {
        continue
      }
      // Explicit arguments are written in the referencing module; defaults live in the
      // declaration's own module, so their source text must be read from there.
      const argumentModule = explicit ? module : declarationModule
      const parameterName =
        typeof parameter.name === 'string'
          ? parameter.name
          : typeof parameter.name === 'string'
            ? parameter.name
            : (getIdentifierName(parameter.name) ?? '')
      let formattedArgument = TypeExtractor.#formatTypeText(argumentModule.source, argument)
      const substituted = substitutions?.get(formattedArgument)
      if (substituted !== undefined) {
        formattedArgument = substituted
      } else {
        const alias = await this.resolveSymbol(argumentModule, formattedArgument, nsNode)
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
  ): Promise<Array<PropApi>> {
    const props: Array<PropApi> = []

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
            const [firstArg, secondArg] = typeArgs
            if (name === 'Omit' && typeArgs.length === 2 && firstArg && secondArg) {
              TypeExtractor.#mergeProperties(
                props,
                await this.#resolveMappedProperties(
                  'Omit',
                  module,
                  firstArg,
                  secondArg,
                  nsNode,
                  substitutions,
                ),
              )
            } else if (name === 'Pick' && typeArgs.length === 2 && firstArg && secondArg) {
              TypeExtractor.#mergeProperties(
                props,
                await this.#resolveMappedProperties(
                  'Pick',
                  module,
                  firstArg,
                  secondArg,
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
                  sym.module,
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
      if (typeAnn.type === 'TSUnionType') {
        return this.#resolveUnionProperties(module, typeAnn.types, nsNode, substitutions)
      }
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
  ): Promise<Array<PropApi>> {
    if (node.type === 'TSTypeLiteral') {
      return this.#extractPropertiesFromTypeLiteral(module, node, nsNode, substitutions)
    }
    if (node.type === 'TSIntersectionType') {
      const res: Array<PropApi> = []
      for (const t of node.types) {
        res.push(...(await this.#resolvePropertiesFromTypeNode(module, t, nsNode, substitutions)))
      }
      return res
    }
    if (node.type === 'TSUnionType') {
      return this.#resolveUnionProperties(module, node.types, nsNode, substitutions)
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
      const typeParams = node.typeArguments?.params ?? []
      const [firstParam, secondParam] = typeParams
      if (name === 'Omit' && typeParams.length === 2 && firstParam && secondParam) {
        return this.#resolveMappedProperties(
          'Omit',
          module,
          firstParam,
          secondParam,
          nsNode,
          substitutions,
        )
      }
      if (name === 'Pick' && typeParams.length === 2 && firstParam && secondParam) {
        return this.#resolveMappedProperties(
          'Pick',
          module,
          firstParam,
          secondParam,
          nsNode,
          substitutions,
        )
      }
      if ((name === 'Partial' || name === 'Required') && typeParams.length === 1 && firstParam) {
        const targetProps = await this.#resolvePropertiesFromTypeNode(
          module,
          firstParam,
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
          sym.module,
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

  /**
   * Merge the props of every union member: a prop stays only if some member declares it, its type
   * is the union of the member types, and it is optional unless every member requires it.
   */
  async #resolveUnionProperties(
    module: ParsedModule,
    members: ReadonlyArray<ESTree.TSType>,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<Array<PropApi>> {
    const merged = new Map<string, PropApi>()
    const typeParts = new Map<string, Set<string>>()
    const memberCounts = new Map<string, number>()
    for (const member of members) {
      const memberProps = await this.#resolvePropertiesFromTypeNode(
        module,
        member,
        nsNode,
        substitutions,
      )
      for (const prop of memberProps) {
        memberCounts.set(prop.name, (memberCounts.get(prop.name) ?? 0) + 1)
        const parts = typeParts.get(prop.name) ?? new Set<string>()
        parts.add(prop.type)
        typeParts.set(prop.name, parts)
        const existing = merged.get(prop.name)
        if (existing) {
          existing.optional ||= prop.optional
          existing.description ??= prop.description
          existing.default ??= prop.default
        } else {
          merged.set(prop.name, { ...prop })
        }
      }
    }
    for (const [name, prop] of merged) {
      prop.type = [...(typeParts.get(name) ?? [])].join(' | ')
      if ((memberCounts.get(name) ?? 0) < members.length) {
        prop.optional = true
      }
    }
    return [...merged.values()]
  }

  async #extractPropertiesFromTypeLiteral(
    module: ParsedModule,
    literal: ESTree.TSTypeLiteral,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<Array<PropApi>> {
    const props: Array<PropApi> = []
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

  async #expandCollectionType(
    binding: TypeBinding,
    bindings = this.#genericBindings,
    visited = new Set<string>(),
  ): Promise<string> {
    const { module, node, namespace } = binding
    const expand = (child: ESTree.TSType) =>
      this.#expandCollectionType({ module, node: child, namespace }, bindings, visited)
    if (node.type === 'TSArrayType') {
      const inner = await expand(node.elementType)
      return `${node.elementType.type === 'TSParenthesizedType' ? inner : `(${inner})`}[]`
    }
    if (node.type === 'TSParenthesizedType') {
      return `(${await expand(node.typeAnnotation)})`
    }
    if (node.type === 'TSTypeOperator' && node.operator === 'readonly') {
      return `readonly ${await expand(node.typeAnnotation)}`
    }
    if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') {
      const parts = await Promise.all(node.types.map(expand))
      return parts.join(node.type === 'TSUnionType' ? ' | ' : ' & ')
    }
    if (node.type === 'TSTypeReference') {
      const name = entityNameToText(node.typeName)
      const bound = name ? bindings.get(name) : undefined
      if (bound) {
        return this.#expandCollectionType(bound, bound.bindings ?? bindings, visited)
      }
      const key = `${module.filePath}:${namespace?.id.type === 'Identifier' ? namespace.id.name : ''}:${name}`
      if (name && !visited.has(key)) {
        const nextVisited = new Set(visited).add(key)
        if ((name === 'Array' || name === 'ReadonlyArray') && node.typeArguments?.params[0]) {
          return `${name === 'ReadonlyArray' ? 'readonly ' : ''}(${await expand(node.typeArguments.params[0])})[]`
        }
        const symbol = await this.resolveSymbol(module, name, namespace)
        if (symbol) {
          const nextBindings = new Map(bindings)
          const params =
            (symbol.node as { typeParameters?: ESTree.TSTypeParameterDeclaration }).typeParameters
              ?.params ?? []
          for (const [index, parameter] of params.entries()) {
            const argument = node.typeArguments?.params[index]
            const fallback = parameter.default ?? parameter.constraint
            const paramName =
              typeof parameter.name === 'string'
                ? parameter.name
                : (getIdentifierName(parameter.name) ?? '')
            if (argument) {
              nextBindings.set(paramName, { module, node: argument, namespace, bindings })
            } else if (fallback) {
              nextBindings.set(paramName, {
                module: symbol.module,
                node: fallback,
                namespace: symbol.nsNode,
              })
            }
          }
          if (symbol.node.type === 'TSTypeAliasDeclaration') {
            return this.#expandCollectionType(
              { module: symbol.module, node: symbol.node.typeAnnotation, namespace: symbol.nsNode },
              nextBindings,
              nextVisited,
            )
          }
          if (symbol.node.type === 'TSInterfaceDeclaration') {
            const substitutions = new Map<string, string>()
            for (const parameter of params) {
              const parameterName =
                typeof parameter.name === 'string'
                  ? parameter.name
                  : (getIdentifierName(parameter.name) ?? '')
              const value = nextBindings.get(parameterName)
              if (value) {
                const expanded = await this.#expandCollectionType(
                  value,
                  value.bindings ?? bindings,
                  nextVisited,
                )
                substitutions.set(parameterName, expanded)
              }
            }
            const props = await this.#resolvePropertiesFromDeclaration(
              symbol.module,
              symbol.node,
              symbol.nsNode,
              substitutions,
            )
            return TypeExtractor.#formatObjectType(props)
          }
        }
      }
    }
    if (node.type === 'TSTypeLiteral') {
      return TypeExtractor.#formatObjectType(
        await this.#extractPropertiesFromTypeLiteral(module, node, namespace),
      )
    }
    return TypeExtractor.#formatTypeText(module.source, node)
  }

  static #formatObjectType(fields: Array<PropApi>): string {
    if (fields.length === 0) {
      return '{}'
    }
    return `{\n${fields
      .map((prop) => {
        const description = prop.description
          ? `  /** ${prop.description.replaceAll('*/', '* /')} */\n`
          : ''
        return `${description}  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type.replaceAll('\n', '\n  ')};`
      })
      .join('\n')}\n}`
  }

  async #convertPropertySignature(
    module: ParsedModule,
    sig: ESTree.TSPropertySignature,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
  ): Promise<PropApi | null> {
    const name = getIdentifierName(sig.key)
    if (!name || (sig.optional && sig.typeAnnotation?.typeAnnotation.type === 'TSNeverKeyword')) {
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
        typeText = typeText.replaceAll(new RegExp(`\\b${paramName}\\b`, 'g'), replacement)
      }
    }

    const typeNode = sig.typeAnnotation?.typeAnnotation
    const isArray =
      typeNode?.type === 'TSArrayType' ||
      (typeNode?.type === 'TSTypeOperator' &&
        typeNode.operator === 'readonly' &&
        typeNode.typeAnnotation.type === 'TSArrayType') ||
      (typeNode?.type === 'TSTypeReference' &&
        ['Array', 'ReadonlyArray'].includes(entityNameToText(typeNode.typeName) ?? ''))
    let typeDetails: string | undefined
    if (isArray && typeNode && !this.#expandingCollection) {
      this.#expandingCollection = true
      try {
        typeDetails = await this.#expandCollectionType({
          module,
          node: typeNode,
          namespace: nsNode,
        })
      } finally {
        this.#expandingCollection = false
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
      ...(typeDetails?.includes('{\n') ? { typeDetails } : {}),
      ...(jsdoc.description ? { description: jsdoc.description } : {}),
      ...(defaultValue ? { default: defaultValue } : {}),
      ...(jsdoc.examples ? { examples: jsdoc.examples } : {}),
    }
  }

  async #resolveTypeText(
    module: ParsedModule,
    node: ESTree.TSType,
    nsNode?: ESTree.TSModuleDeclaration,
    substitutions?: Map<string, string>,
    styleAliasStack = new Set<string>(),
  ): Promise<string> {
    if (node.type === 'TSTypeReference') {
      const name = entityNameToText(node.typeName)
      const substitution = name && substitutions?.get(name)
      if (substitution) {
        return substitution
      }
      if (name) {
        const resolved = await this.resolveSymbol(module, name, nsNode)
        if (
          resolved?.node.type === 'TSTypeAliasDeclaration' &&
          isStyleTypeModule(resolved.module.filePath) &&
          isFiniteStyleAlias(resolved.node.typeAnnotation)
        ) {
          const key = `${resolved.module.filePath}:${name}`
          if (!styleAliasStack.has(key)) {
            return this.#resolveTypeText(
              resolved.module,
              resolved.node.typeAnnotation,
              resolved.nsNode,
              substitutions,
              new Set([...styleAliasStack, key]),
            )
          }
        }
      }
    }
    if (node.type === 'TSIndexedAccessType') {
      const resolved = await this.#resolveIndexedAccessType(module, node, nsNode, substitutions)
      if (resolved) {
        return resolved
      }
    }

    if (node.type === 'TSUnionType') {
      const parts = await Promise.all(
        node.types.map((t) =>
          this.#resolveTypeText(module, t, nsNode, substitutions, styleAliasStack),
        ),
      )
      return parts.join(' | ')
    }

    if (node.type === 'TSIntersectionType') {
      const parts = await Promise.all(
        node.types.map((t) =>
          this.#resolveTypeText(module, t, nsNode, substitutions, styleAliasStack),
        ),
      )
      return parts.join(' & ')
    }

    if (node.type === 'TSArrayType') {
      if (node.elementType.type === 'TSTypeReference') {
        const replacement = substitutions?.get(entityNameToText(node.elementType.typeName) ?? '')
        if (replacement) {
          return `(${replacement})[]`
        }
      }
      const inner = await this.#resolveTypeText(
        module,
        node.elementType,
        nsNode,
        substitutions,
        styleAliasStack,
      )
      return `${inner}[]`
    }

    if (node.type === 'TSParenthesizedType') {
      const inner = await this.#resolveTypeText(
        module,
        node.typeAnnotation,
        nsNode,
        substitutions,
        styleAliasStack,
      )
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
        const results: Array<string> = []
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
      .replaceAll(/\/\*[\s\S]*?\*\//g, '')
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/\s*\|\s*/g, ' | ')
      .replaceAll(/\s*&\s*/g, ' & ')
      .replaceAll(/\s*:\s*/g, ': ')
      .replaceAll(/\s*,\s*/g, ', ')
      .replaceAll(/{\s+/g, '{ ')
      .replaceAll(/\s+}/g, ' }')
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
  ): Array<GenericParameterApi> {
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
