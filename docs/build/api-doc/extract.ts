import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

import { toKebabCase } from '../core/strings'

import { preprocessGenericTypeAliases } from './transform-types'
import type {
  ComponentDoc,
  ComponentIndexEntry,
  GenerationResult,
  InheritedGroupDoc,
  ItemDoc,
  PropDoc,
  SlotDoc,
} from './types'

function categoryFromSourcePath(sourcePath: string | undefined): string {
  return sourcePath?.replace(/\\/g, '/').split('/')[1] || 'General'
}

function displayText(parts: readonly ts.SymbolDisplayPart[] | string | undefined): string {
  if (!parts) {
    return ''
  }
  if (typeof parts === 'string') {
    return parts
  }
  return ts.displayPartsToString([...parts])
}

function normalizeDefaultTag(tagText: ts.JSDocTagInfo['text']): string | undefined {
  const text = displayText(tagText).trim()
  return text ? text.replace(/^['"]|['"]$/g, '') : undefined
}

function typeIncludesUndefined(type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.Undefined) !== 0) {
    return true
  }
  if (type.isUnion()) {
    return type.types.some(typeIncludesUndefined)
  }
  return false
}

const TYPE_FORMAT_FLAGS =
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope

interface PropFormatContext {
  componentName?: string
  slotOverrideTypes?: ReadonlySet<string>
}

export function normalizePathForComparison(filePath: string): string {
  const resolved = path.resolve(filePath).replaceAll('\\', '/')
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function inferModuleFromFileName(fileName: string): string {
  const normalized = fileName.replaceAll('\\', '/')
  const idx = normalized.lastIndexOf('/node_modules/')
  if (idx === -1) {
    return 'Moraine'
  }

  const rest = normalized.slice(idx + '/node_modules/'.length)
  const parts = rest.split('/').filter(Boolean)
  return parts[0]?.startsWith('@') && parts[1] ? `${parts[0]}/${parts[1]}` : (parts[0] ?? 'unknown')
}

function resolveSourcePath(regionPath: string | undefined): string | undefined {
  if (!regionPath || !regionPath.startsWith('src/') || !regionPath.endsWith('.d.ts')) {
    return regionPath
  }

  const base = regionPath.slice(0, -'.d.ts'.length)
  const tsxPath = `${base}.tsx`
  if (existsSync(tsxPath)) {
    return tsxPath
  }

  const tsPath = `${base}.ts`
  if (existsSync(tsPath)) {
    return tsPath
  }

  return regionPath
}

function buildRegionByLine(text: string): Array<string | undefined> {
  const lines = text.split(/\r?\n/g)
  const regions: Array<string | undefined> = new Array(lines.length)
  let current: string | undefined

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (line.startsWith('//#region ')) {
      current = line.slice('//#region '.length).trim()
    } else if (line.startsWith('//#endregion')) {
      current = undefined
    }
    regions[index] = current
  }

  return regions
}

function entityNameToParts(name: ts.EntityName): string[] {
  if (ts.isIdentifier(name)) {
    return [name.text]
  }
  return [...entityNameToParts(name.left), name.right.text]
}

function entityNameToText(name: ts.EntityName): string {
  return entityNameToParts(name).join('.')
}

function isJsxElementReturn(typeNode: ts.TypeNode | undefined): boolean {
  if (!typeNode) {
    return false
  }

  if (!ts.isTypeReferenceNode(typeNode)) {
    return false
  }

  const parts = entityNameToParts(typeNode.typeName)
  return parts.length >= 2 && parts.at(-2) === 'JSX' && parts.at(-1) === 'Element'
}

function getLiteralStringText(node: ts.Expression): string | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  return undefined
}

function extractSlotDocs(node: ts.ModuleDeclaration, checker: ts.TypeChecker): SlotDoc[] {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return []
  }

  for (const statement of body.statements) {
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === 'Slot') {
      const docs = extractSlotDocsFromInterface(statement, checker)

      if (docs.length > 0) {
        return docs
      }
    }

    if (ts.isTypeAliasDeclaration(statement) && statement.name.text === 'Slot') {
      const docs = extractSlotDocsFromTypeNode(statement.type, checker)

      if (docs.length > 0) {
        return docs
      }
    }
  }

  return []
}

function extractSlotDocsFromInterface(
  node: ts.InterfaceDeclaration,
  checker: ts.TypeChecker,
): SlotDoc[] {
  const docs = node.members
    .filter(ts.isPropertySignature)
    .map((member) => createSlotDocFromProperty(member, checker))
    .filter((doc): doc is SlotDoc => Boolean(doc))

  const inheritedDocs = node.heritageClauses?.flatMap((clause) =>
    clause.types.flatMap((typeNode) =>
      extractSlotDocsFromType(checker.getTypeAtLocation(typeNode), checker),
    ),
  )

  return uniqueSlotDocs([...(inheritedDocs ?? []), ...docs])
}

function createSlotDocFromProperty(
  member: ts.PropertySignature,
  checker: ts.TypeChecker,
): SlotDoc | undefined {
  const name =
    ts.isIdentifier(member.name) || ts.isStringLiteral(member.name) ? member.name.text : undefined

  if (!name) {
    return undefined
  }

  const symbol = checker.getSymbolAtLocation(member.name)
  const description = displayText(symbol?.getDocumentationComment(checker)).trim() || undefined

  return {
    name,
    ...(description ? { description } : {}),
  }
}

function extractSlotDocsFromTypeNode(typeNode: ts.TypeNode, checker: ts.TypeChecker): SlotDoc[] {
  if (ts.isUnionTypeNode(typeNode)) {
    return uniqueSlotDocs(
      typeNode.types.flatMap((node) => extractSlotDocsFromTypeNode(node, checker)),
    )
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    const name = getLiteralStringText(typeNode.literal)
    return name ? [{ name }] : []
  }

  // Resolve aliases and namespace references such as `BaseSelectT.Slot`.
  return extractSlotDocsFromType(checker.getTypeFromTypeNode(typeNode), checker)
}

function extractSlotDocsFromType(type: ts.Type, checker: ts.TypeChecker): SlotDoc[] {
  if (type.isStringLiteral()) {
    return [{ name: type.value }]
  }
  if (type.isUnion()) {
    return uniqueSlotDocs(type.types.flatMap((item) => extractSlotDocsFromType(item, checker)))
  }

  const properties = checker.getPropertiesOfType(type)
  if (properties.length > 0) {
    return uniqueSlotDocs(
      properties.map((symbol) => {
        const description = displayText(symbol.getDocumentationComment(checker)).trim() || undefined
        const doc: SlotDoc = {
          name: symbol.getName(),
        }

        if (description) {
          doc.description = description
        }

        return doc
      }),
    )
  }

  return []
}

function uniqueSlotDocs(values: SlotDoc[]): SlotDoc[] {
  const docs = new Map<string, SlotDoc>()

  for (const value of values) {
    const existing = docs.get(value.name)
    docs.set(value.name, existing?.description ? existing : value)
  }

  return [...docs.values()]
}

function extractItemsAliasPropDocs(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  typeNode: ts.TypeNode,
  visited = new Set<string>(),
): PropDoc[] {
  const visitKey = `${typeNode.pos}:${typeNode.end}:${typeNode.kind}`
  if (visited.has(visitKey)) {
    return []
  }
  visited.add(visitKey)

  if (
    ts.isTypeReferenceNode(typeNode) &&
    typeNode.typeArguments &&
    typeNode.typeArguments.length > 0
  ) {
    const props = extractItemsAliasPropDocs(
      checker,
      sourceFile,
      typeNode.typeArguments[0]!,
      visited,
    )
    if (props.length > 0) {
      return props
    }
  }

  if (ts.isArrayTypeNode(typeNode)) {
    const props = extractItemsAliasPropDocs(checker, sourceFile, typeNode.elementType, visited)
    if (props.length > 0) {
      return props
    }
  }

  if (ts.isUnionTypeNode(typeNode)) {
    for (const unionTypeNode of typeNode.types) {
      const props = extractItemsAliasPropDocs(checker, sourceFile, unionTypeNode, visited)
      if (props.length > 0) {
        return props
      }
    }
  }

  const resolvedType = checker.getTypeFromTypeNode(typeNode)
  return extractOwnPropDocsFromType(checker, sourceFile, resolvedType, typeNode)
}

function getEnclosingModuleName(node: ts.Node): string | undefined {
  let current: ts.Node | undefined = node
  while (current) {
    if (ts.isModuleDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text
    }
    current = current.parent
  }
  return undefined
}

function getSlotOverrideTypeName(propName: string): 'Classes' | 'Styles' | undefined {
  if (propName === 'classes') {
    return 'Classes'
  }
  if (propName === 'styles') {
    return 'Styles'
  }
  return undefined
}

function getGenericSlotOverrideTypeName(
  propName: string,
): 'SlotClasses' | 'SlotStyles' | undefined {
  if (propName === 'classes') {
    return 'SlotClasses'
  }
  if (propName === 'styles') {
    return 'SlotStyles'
  }
  return undefined
}

function getSlotOverrideAliasFromTypeNode(
  typeNode: ts.TypeNode,
  declaration: ts.Node,
  propName: string,
  context: PropFormatContext,
): string | undefined {
  const overrideTypeName = getSlotOverrideTypeName(propName)
  const genericTypeName = getGenericSlotOverrideTypeName(propName)
  if (!overrideTypeName || !genericTypeName || !context.componentName) {
    return undefined
  }

  if (!ts.isTypeReferenceNode(typeNode)) {
    return undefined
  }

  const typeName = entityNameToText(typeNode.typeName)
  const componentNamespace = `${context.componentName}T`
  const componentAlias = `${componentNamespace}.${overrideTypeName}`

  if (typeName === genericTypeName) {
    return context.slotOverrideTypes?.has(overrideTypeName) ? componentAlias : undefined
  }

  if (typeName === overrideTypeName) {
    return getEnclosingModuleName(declaration) === componentNamespace ? componentAlias : undefined
  }

  return typeName
}

function formatSlotOverridePropType(
  propSymbol: ts.Symbol,
  propType: ts.Type,
  propName: string,
  context: PropFormatContext,
): string | undefined {
  if (!getSlotOverrideTypeName(propName)) {
    return undefined
  }

  const aliases: string[] = []
  const seen = new Set<string>()

  for (const declaration of propSymbol.declarations ?? []) {
    if (!ts.isPropertySignature(declaration) || !declaration.type) {
      continue
    }

    const alias = getSlotOverrideAliasFromTypeNode(declaration.type, declaration, propName, context)
    if (!alias || seen.has(alias)) {
      continue
    }

    seen.add(alias)
    aliases.push(alias)
  }

  if (aliases.length === 0) {
    return undefined
  }

  const baseType = aliases.length === 1 ? aliases[0]! : `(${aliases.join(' & ')})`
  return typeIncludesUndefined(propType) ? `${baseType} | undefined` : baseType
}

function formatPropType(
  checker: ts.TypeChecker,
  propSymbol: ts.Symbol,
  propType: ts.Type,
  location: ts.Node,
  context: PropFormatContext = {},
): string {
  const propName = propSymbol.getName()
  const typeText = checker.typeToString(propType, location, TYPE_FORMAT_FLAGS)
  return formatSlotOverridePropType(propSymbol, propType, propName, context) ?? typeText
}

function createPropDoc(
  checker: ts.TypeChecker,
  propSymbol: ts.Symbol,
  location: ts.Node,
  propTypeOverride?: ts.Type,
  context: PropFormatContext = {},
): PropDoc {
  const propType = propTypeOverride ?? checker.getTypeOfSymbolAtLocation(propSymbol, location)
  const optionalFlag = (propSymbol.flags & ts.SymbolFlags.Optional) !== 0
  const required = !(optionalFlag || typeIncludesUndefined(propType))
  const description = displayText(propSymbol.getDocumentationComment(checker)).trim() || undefined
  const defaultTag = propSymbol.getJsDocTags().find((tag) => tag.name === 'default')

  return {
    name: propSymbol.getName(),
    required,
    type: formatPropType(checker, propSymbol, propType, location, context),
    ...(description ? { description } : {}),
    ...(defaultTag ? { defaultValue: normalizeDefaultTag(defaultTag.text) } : {}),
  }
}

function extractOwnPropDocsFromType(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  sourceType: ts.Type,
  location: ts.Node,
  context: PropFormatContext = {},
): PropDoc[] {
  return checker
    .getPropertiesOfType(sourceType)
    .filter((symbol) => {
      const declaration = symbol.declarations?.[0]
      return (
        declaration?.getSourceFile().fileName === sourceFile.fileName &&
        (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration))
      )
    })
    .map((symbol) => createPropDoc(checker, symbol, location, undefined, context))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function extractItemsDoc(
  node: ts.ModuleDeclaration,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ItemDoc | undefined {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return undefined
  }

  for (const statement of body.statements) {
    if (
      (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) ||
      statement.name.text !== 'Item'
    ) {
      continue
    }

    const itemsType = ts.isInterfaceDeclaration(statement)
      ? checker.getTypeAtLocation(statement)
      : checker.getTypeFromTypeNode(statement.type)
    const symbol = checker.getSymbolAtLocation(statement.name)
    const description = displayText(symbol?.getDocumentationComment(checker)).trim() || undefined
    const props = ts.isInterfaceDeclaration(statement)
      ? extractOwnPropDocsFromType(checker, sourceFile, itemsType, statement)
      : extractItemsAliasPropDocs(checker, sourceFile, statement.type)

    if (!description && props.length === 0) {
      return undefined
    }

    return { props, ...(description ? { description } : {}) }
  }

  return undefined
}

function groupProperties(
  propsType: ts.Type,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  location: ts.Node,
  context: PropFormatContext = {},
): { own: PropDoc[]; inherited: InheritedGroupDoc[] } {
  const own: PropDoc[] = []
  const inheritedGroups = new Map<string, PropDoc[]>()

  for (const propSymbol of checker.getPropertiesOfType(propsType)) {
    const doc = createPropDoc(checker, propSymbol, location, undefined, context)
    const declaration = propSymbol.declarations?.[0]
    const isOwn = declaration?.getSourceFile().fileName === sourceFile.fileName

    if (isOwn) {
      own.push(doc)
      continue
    }

    const from = declaration
      ? inferModuleFromFileName(declaration.getSourceFile().fileName)
      : 'External'
    const list = inheritedGroups.get(from) ?? []
    list.push(doc)
    inheritedGroups.set(from, list)
  }

  own.sort((left, right) => left.name.localeCompare(right.name))

  const inherited = [...inheritedGroups.entries()]
    .filter(([from]) => shouldIncludeInheritedGroup(from))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([from, props]) => ({
      from,
      props: props.sort((left, right) => left.name.localeCompare(right.name)),
    }))

  return { own, inherited }
}

export function shouldIncludeInheritedGroup(from: string): boolean {
  return from !== 'solid-js'
}

interface ComponentMetadata {
  slots: Map<string, SlotDoc[]>
  items: Map<string, ItemDoc>
  baseInherited: Map<string, InheritedGroupDoc[]>
  slotOverrideTypes: Map<string, ReadonlySet<string>>
}

function mergeInheritedGroups(...groups: InheritedGroupDoc[][]): InheritedGroupDoc[] {
  const merged = new Map<string, Map<string, PropDoc>>()

  for (const groupList of groups) {
    for (const group of groupList) {
      const props = merged.get(group.from) ?? new Map<string, PropDoc>()
      for (const prop of group.props) {
        props.set(prop.name, prop)
      }
      merged.set(group.from, props)
    }
  }

  return [...merged.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([from, props]) => ({
      from,
      props: [...props.values()].sort((left, right) => left.name.localeCompare(right.name)),
    }))
}

function extractBaseInheritedGroups(
  node: ts.ModuleDeclaration,
  checker: ts.TypeChecker,
): InheritedGroupDoc[] {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return []
  }

  const groups = new Map<string, PropDoc[]>()

  const addProp = (propSymbol: ts.Symbol, location: ts.Node, propType?: ts.Type) => {
    const declaration = propSymbol.declarations?.[0]
    const from = declaration
      ? inferModuleFromFileName(declaration.getSourceFile().fileName)
      : 'External'

    if (!shouldIncludeInheritedGroup(from)) {
      return
    }

    const props = groups.get(from) ?? []
    props.push(createPropDoc(checker, propSymbol, location, propType))
    groups.set(from, props)
  }

  for (const statement of body.statements) {
    if (!ts.isInterfaceDeclaration(statement) || statement.name.text !== 'Base') {
      continue
    }

    for (const clause of statement.heritageClauses ?? []) {
      for (const typeNode of clause.types) {
        if (
          ts.isExpressionWithTypeArguments(typeNode) &&
          ts.isIdentifier(typeNode.expression) &&
          typeNode.expression.text === 'Pick' &&
          typeNode.typeArguments?.length === 2
        ) {
          const sourceType = checker.getTypeFromTypeNode(typeNode.typeArguments[0]!)
          const keyType = typeNode.typeArguments[1]!
          const keyNodes = ts.isUnionTypeNode(keyType) ? keyType.types : [keyType]

          for (const keyNode of keyNodes) {
            if (!ts.isLiteralTypeNode(keyNode)) {
              continue
            }

            const name = getLiteralStringText(keyNode.literal)
            const propSymbol = name ? sourceType.getProperty(name) : undefined
            if (!propSymbol) {
              continue
            }

            addProp(propSymbol, typeNode, checker.getTypeOfSymbolAtLocation(propSymbol, typeNode))
          }

          continue
        }

        const type = checker.getTypeAtLocation(typeNode)
        for (const propSymbol of checker.getPropertiesOfType(type)) {
          addProp(propSymbol, typeNode, checker.getTypeOfSymbolAtLocation(propSymbol, typeNode))
        }
      }
    }
  }

  return [...groups.entries()].map(([from, props]) => ({
    from,
    props: props.sort((left, right) => left.name.localeCompare(right.name)),
  }))
}

function collectNamespaceMetadata(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ComponentMetadata {
  const slots = new Map<string, SlotDoc[]>()
  const items = new Map<string, ItemDoc>()
  const baseInherited = new Map<string, InheritedGroupDoc[]>()
  const slotOverrideTypes = new Map<string, ReadonlySet<string>>()

  const visit = (node: ts.Node) => {
    if (ts.isModuleDeclaration(node) && node.name.text.endsWith('T')) {
      const componentName = node.name.text.slice(0, -1)
      const body = node.body
      const overrideTypes = new Set<string>()
      if (body && ts.isModuleBlock(body)) {
        for (const statement of body.statements) {
          if (
            (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
            (statement.name.text === 'Classes' || statement.name.text === 'Styles')
          ) {
            overrideTypes.add(statement.name.text)
          }
        }
      }
      if (overrideTypes.size > 0) {
        slotOverrideTypes.set(componentName, overrideTypes)
      }

      const slotDocs = extractSlotDocs(node, checker)
      if (slotDocs.length > 0) {
        slots.set(componentName, slotDocs)
      }

      const itemsDoc = extractItemsDoc(node, sourceFile, checker)
      if (itemsDoc) {
        items.set(componentName, itemsDoc)
      }

      const inherited = extractBaseInheritedGroups(node, checker)
      if (inherited.length > 0) {
        baseInherited.set(componentName, inherited)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return { slots, items, baseInherited, slotOverrideTypes }
}

function processComponentNode(
  node: ts.FunctionDeclaration,
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  regionByLine: Array<string | undefined>,
  metadata: ComponentMetadata,
): { key: string; doc: ComponentDoc } | null {
  if (!node.name || node.parameters.length === 0 || !isJsxElementReturn(node.type)) {
    return null
  }

  const propsParam = node.parameters[0]!
  if (!propsParam.type) {
    return null
  }

  const componentName = node.name.text
  const componentKey = toKebabCase(componentName)
  const functionSymbol = checker.getSymbolAtLocation(node.name)
  const description =
    displayText(functionSymbol?.getDocumentationComment(checker)).trim() || undefined
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line
  const sourcePath = resolveSourcePath(regionByLine[line])
  const propsType = checker.getTypeFromTypeNode(propsParam.type)

  const component: ComponentIndexEntry = {
    key: componentKey,
    name: componentName,
    category: categoryFromSourcePath(sourcePath),
    polymorphic: Boolean(propsType.getProperty('as')),
    ...(description ? { description } : {}),
    ...(sourcePath ? { sourcePath } : {}),
  }

  const doc: ComponentDoc = {
    component,
    slots: metadata.slots.get(componentName) ?? [],
    ...(metadata.items.get(componentName) ? { item: metadata.items.get(componentName) } : {}),
    props: (() => {
      const propFormatContext: PropFormatContext = {
        componentName,
        slotOverrideTypes: metadata.slotOverrideTypes.get(componentName),
      }
      const props = groupProperties(
        propsType,
        checker,
        sourceFile,
        propsParam.name,
        propFormatContext,
      )
      const ownPropNames = new Set(props.own.map((prop) => prop.name))
      const baseInherited = (metadata.baseInherited.get(componentName) ?? [])
        .map((group) => ({
          from: group.from,
          props: group.props.filter((prop) => !ownPropNames.has(prop.name)),
        }))
        .filter((group) => group.props.length > 0)
      return {
        own: props.own,
        inherited: mergeInheritedGroups(props.inherited, baseInherited),
      }
    })(),
  }

  return { key: componentKey, doc }
}

export function generateApiDoc(projectRoot: string): GenerationResult | null {
  const dtsPath = path.join(projectRoot, 'dist', 'index.d.mts')
  if (!existsSync(dtsPath)) {
    console.warn(`[api-doc] ${dtsPath} not found, skipping generation`)
    return null
  }

  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    noEmit: true,
    types: [],
  }

  const dtsContent = readFileSync(dtsPath, 'utf-8')
  const processedContent = preprocessGenericTypeAliases(dtsContent, dtsPath)
  const useCustomHost = processedContent !== dtsContent
  const normalizedDtsPath = normalizePathForComparison(dtsPath)

  const baseHost = ts.createCompilerHost(options, true)
  const host: ts.CompilerHost = useCustomHost
    ? {
        ...baseHost,
        getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
          if (normalizePathForComparison(fileName) === normalizedDtsPath) {
            return ts.createSourceFile(fileName, processedContent, languageVersion, true)
          }
          return baseHost.getSourceFile(
            fileName,
            languageVersion,
            onError,
            shouldCreateNewSourceFile,
          )
        },
      }
    : baseHost

  const program = ts.createProgram([dtsPath], options, host)
  const checker = program.getTypeChecker()
  const sourceFile =
    program.getSourceFile(dtsPath) ??
    program
      .getSourceFiles()
      .find((item) => normalizePathForComparison(item.fileName) === normalizedDtsPath)
  if (!sourceFile) {
    console.warn('[api-doc] Failed to parse dist/index.d.mts')
    return null
  }

  const regionByLine = buildRegionByLine(sourceFile.getFullText())
  const metadata = collectNamespaceMetadata(sourceFile, checker)
  const componentDocs = new Map<string, ComponentDoc>()

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node)) {
      const component = processComponentNode(node, checker, sourceFile, regionByLine, metadata)
      if (component) {
        componentDocs.set(component.key, component.doc)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return {
    indexDoc: {
      components: [...componentDocs.values()].map((doc) => doc.component),
    },
    componentDocs,
  }
}
