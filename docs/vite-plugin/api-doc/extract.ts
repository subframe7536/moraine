import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import ts from 'typescript'

import { toKebabCase } from '../core/strings'

import type {
  ComponentDoc,
  ComponentIndexEntry,
  GenerationResult,
  InheritedGroupDoc,
  ItemsDoc,
  PropDoc,
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

let _kobalteHashMap: Map<string, string> | undefined
let _projectRoot: string | undefined

export function normalizePathForComparison(filePath: string): string {
  const resolved = path.resolve(filePath).replaceAll('\\', '/')
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

function extractIndexHashFileName(moduleSpecifier: string): string | undefined {
  const normalized = moduleSpecifier.replaceAll('\\', '/')
  if (!normalized.startsWith('../')) {
    return undefined
  }

  const parsed = path.posix.parse(normalized)
  if (!parsed.name.startsWith('index-')) {
    return undefined
  }

  return `${parsed.name}.d.ts`
}

function trimKobalteDistHashSuffix(fileName: string): string {
  if (!fileName.endsWith('.d.ts')) {
    return fileName
  }

  const nameWithoutExt = fileName.slice(0, -'.d.ts'.length)
  const hashSeparator = nameWithoutExt.lastIndexOf('-')
  if (hashSeparator <= 0) {
    return fileName
  }

  const hashPart = nameWithoutExt.slice(hashSeparator + 1)
  if (!/^[\da-f]+$/i.test(hashPart)) {
    return fileName
  }

  const partSeparator = nameWithoutExt.lastIndexOf('-', hashSeparator - 1)
  if (partSeparator <= 0) {
    return fileName
  }

  return nameWithoutExt.slice(0, partSeparator)
}

/**
 * Scans `@kobalte/core/dist/` for component index files and builds a reverse mapping
 * from hash-based filenames (e.g. `index-4cb1a0c7.d.ts`) to component names (e.g. `accordion`).
 */
function getKobalteHashMap(): Map<string, string> {
  if (_kobalteHashMap) {
    return _kobalteHashMap
  }

  _kobalteHashMap = new Map()

  if (!_projectRoot) {
    return _kobalteHashMap
  }

  try {
    const distDir = path.join(_projectRoot, 'node_modules', '@kobalte', 'core', 'dist')

    if (!existsSync(distDir)) {
      return _kobalteHashMap
    }

    const entries = readdirSync(distDir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const componentName = entry.name
      const indexPath = path.join(distDir, componentName, 'index.d.ts')

      if (!existsSync(indexPath)) {
        continue
      }

      const content = readFileSync(indexPath, 'utf-8')
      const sourceFile = ts.createSourceFile(indexPath, content, ts.ScriptTarget.Latest, true)

      for (const statement of sourceFile.statements) {
        if (!ts.isExportDeclaration(statement)) {
          continue
        }

        const moduleSpecifier = statement.moduleSpecifier
        if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) {
          continue
        }

        const hashBaseName = extractIndexHashFileName(moduleSpecifier.text)
        if (!hashBaseName) {
          continue
        }

        _kobalteHashMap.set(hashBaseName, componentName)
        break
      }
    }
  } catch {
    // Silently ignore errors — fallback to the existing heuristic
  }

  return _kobalteHashMap
}

function inferModuleFromFileName(fileName: string): string {
  const normalized = fileName.replaceAll('\\', '/')
  const idx = normalized.lastIndexOf('/node_modules/')
  if (idx === -1) {
    return 'Moraine'
  }

  const rest = normalized.slice(idx + '/node_modules/'.length)
  const parts = rest.split('/').filter(Boolean)
  const pkg =
    parts[0]?.startsWith('@') && parts[1] ? `${parts[0]}/${parts[1]}` : (parts[0] ?? 'unknown')

  if (pkg === '@kobalte/core') {
    const packageParts = parts[0]?.startsWith('@') ? parts.slice(2) : parts.slice(1)
    const distRoot = packageParts[0]
    const componentName = packageParts[1]
    const normalizedComponentName = componentName
      ? trimKobalteDistHashSuffix(componentName)
      : componentName

    if (
      distRoot === 'dist' &&
      normalizedComponentName &&
      !normalizedComponentName.startsWith('index-')
    ) {
      return `${pkg}/${normalizedComponentName}`
    }

    // Fall back to the hash-file reverse mapping for bundled index files
    const baseName = path.posix.basename(normalized)
    const hashMap = getKobalteHashMap()
    const hashComponentName = hashMap.get(baseName)
    if (hashComponentName) {
      return `${pkg}/${hashComponentName}`
    }

    return pkg
  }

  return pkg
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

function extractSlotNames(node: ts.ModuleDeclaration, checker: ts.TypeChecker): string[] {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return []
  }

  for (const statement of body.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || statement.name.text !== 'Slot') {
      continue
    }

    if (ts.isUnionTypeNode(statement.type)) {
      return statement.type.types
        .filter((typeNode): typeNode is ts.LiteralTypeNode => ts.isLiteralTypeNode(typeNode))
        .map((typeNode) => getLiteralStringText(typeNode.literal))
        .filter((name): name is string => Boolean(name))
    }

    if (ts.isLiteralTypeNode(statement.type)) {
      const name = getLiteralStringText(statement.type.literal)
      return name ? [name] : []
    }

    // Fallback: resolve via type checker (handles alias references like `export type Slot = SomeSharedSlots`)
    const resolvedType = checker.getTypeFromTypeNode(statement.type)
    const names = extractStringLiteralsFromType(resolvedType)
    if (names.length > 0) {
      return names
    }
  }

  return []
}

function extractStringLiteralsFromType(type: ts.Type): string[] {
  if (type.isStringLiteral()) {
    return [type.value]
  }
  if (type.isUnion()) {
    return type.types.flatMap(extractStringLiteralsFromType)
  }
  return []
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
    const props = extractItemsAliasPropDocs(checker, sourceFile, typeNode.typeArguments[0], visited)
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

function createPropDoc(checker: ts.TypeChecker, propSymbol: ts.Symbol, location: ts.Node): PropDoc {
  const propType = checker.getTypeOfSymbolAtLocation(propSymbol, location)
  const optionalFlag = (propSymbol.flags & ts.SymbolFlags.Optional) !== 0
  const required = !(optionalFlag || typeIncludesUndefined(propType))
  const description = displayText(propSymbol.getDocumentationComment(checker)).trim() || undefined
  const defaultTag = propSymbol.getJsDocTags().find((tag) => tag.name === 'default')

  return {
    name: propSymbol.getName(),
    required,
    type: checker.typeToString(propType, location, TYPE_FORMAT_FLAGS),
    ...(description ? { description } : {}),
    ...(defaultTag ? { defaultValue: normalizeDefaultTag(defaultTag.text) } : {}),
  }
}

function extractOwnPropDocsFromType(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  sourceType: ts.Type,
  location: ts.Node,
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
    .map((symbol) => createPropDoc(checker, symbol, location))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function extractItemsDoc(
  node: ts.ModuleDeclaration,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ItemsDoc | undefined {
  const body = node.body
  if (!body || !ts.isModuleBlock(body)) {
    return undefined
  }

  for (const statement of body.statements) {
    if (
      (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement)) ||
      statement.name.text !== 'Items'
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
): { own: PropDoc[]; inherited: InheritedGroupDoc[] } {
  const own: PropDoc[] = []
  const inheritedGroups = new Map<string, PropDoc[]>()

  for (const propSymbol of checker.getPropertiesOfType(propsType)) {
    const doc = createPropDoc(checker, propSymbol, location)
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
  slots: Map<string, string[]>
  items: Map<string, ItemsDoc>
}

function collectNamespaceMetadata(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ComponentMetadata {
  const slots = new Map<string, string[]>()
  const items = new Map<string, ItemsDoc>()

  const visit = (node: ts.Node) => {
    if (ts.isModuleDeclaration(node) && node.name.text.endsWith('T')) {
      const componentName = node.name.text.slice(0, -1)
      const slotNames = extractSlotNames(node, checker)
      if (slotNames.length > 0) {
        slots.set(componentName, slotNames)
      }

      const itemsDoc = extractItemsDoc(node, sourceFile, checker)
      if (itemsDoc) {
        items.set(componentName, itemsDoc)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return { slots, items }
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

  const propsParam = node.parameters[0]
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
    props: groupProperties(propsType, checker, sourceFile, propsParam.name),
    ...(metadata.items.get(componentName) ? { items: metadata.items.get(componentName) } : {}),
  }

  return { key: componentKey, doc }
}

interface GenericAliasInfo {
  paramName: string
  defaultType: ts.TypeNode
}

interface GenericFunctionInfo {
  paramName: string
  defaultType: ts.TypeNode
}

function collectAliasReferences(
  node: ts.Node | undefined,
  aliasNames: ReadonlySet<string>,
  out: Set<string>,
): void {
  if (!node) {
    return
  }

  const visit = (child: ts.Node) => {
    if (
      ts.isTypeReferenceNode(child) &&
      ts.isIdentifier(child.typeName) &&
      aliasNames.has(child.typeName.text)
    ) {
      out.add(child.typeName.text)
    }
    ts.forEachChild(child, visit)
  }

  visit(node)
}

function replaceTypeReferences(
  root: ts.Node,
  context: ts.TransformationContext,
  genericParamName: string | undefined,
  genericDefaultType: ts.TypeNode | undefined,
  aliasNames: ReadonlySet<string>,
): ts.Node {
  const visit = (node: ts.Node): ts.Node => {
    if (
      genericParamName &&
      genericDefaultType &&
      ts.isTypeReferenceNode(node) &&
      !node.typeArguments &&
      ts.isIdentifier(node.typeName) &&
      node.typeName.text === genericParamName
    ) {
      return cloneTypeNode(genericDefaultType)
    }

    if (
      ts.isTypeReferenceNode(node) &&
      node.typeArguments &&
      node.typeArguments.length > 0 &&
      ts.isIdentifier(node.typeName) &&
      aliasNames.has(node.typeName.text)
    ) {
      return ts.factory.updateTypeReferenceNode(node, node.typeName, undefined)
    }

    return ts.visitEachChild(node, visit, context)
  }

  return ts.visitNode(root, visit)
}

function cloneTypeNode(typeNode: ts.TypeNode): ts.TypeNode {
  const nodeFactory = ts.factory as ts.NodeFactory & { cloneNode(node: ts.Node): ts.Node }
  return nodeFactory.cloneNode(typeNode) as ts.TypeNode
}

function preprocessGenericTypeAliases(text: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true)
  const genericAliases = new Map<string, GenericAliasInfo>()

  for (const statement of sourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) {
      continue
    }
    if (!statement.typeParameters || statement.typeParameters.length !== 1) {
      continue
    }

    const typeParam = statement.typeParameters[0]
    if (!typeParam.default) {
      continue
    }

    genericAliases.set(statement.name.text, {
      paramName: typeParam.name.text,
      defaultType: typeParam.default,
    })
  }

  if (genericAliases.size === 0) {
    return text
  }

  const aliasNames = new Set(genericAliases.keys())
  const referencedAliases = new Set<string>()
  const functionGenerics = new Map<ts.FunctionDeclaration, GenericFunctionInfo>()

  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement)) {
      continue
    }
    if (!statement.typeParameters || statement.typeParameters.length !== 1) {
      continue
    }

    const typeParam = statement.typeParameters[0]
    if (!typeParam.default) {
      continue
    }

    const aliasesInParameters = new Set<string>()
    for (const parameter of statement.parameters) {
      collectAliasReferences(parameter.type, aliasNames, aliasesInParameters)
    }
    if (aliasesInParameters.size === 0) {
      continue
    }

    for (const aliasName of aliasesInParameters) {
      referencedAliases.add(aliasName)
    }

    functionGenerics.set(statement, {
      paramName: typeParam.name.text,
      defaultType: typeParam.default,
    })
  }

  if (referencedAliases.size === 0) {
    return text
  }

  let changed = false
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit = (node: ts.Node): ts.Node => {
      if (ts.isTypeAliasDeclaration(node) && referencedAliases.has(node.name.text)) {
        const aliasInfo = genericAliases.get(node.name.text)
        if (aliasInfo) {
          changed = true
          const updatedType = replaceTypeReferences(
            node.type,
            context,
            aliasInfo.paramName,
            aliasInfo.defaultType,
            referencedAliases,
          ) as ts.TypeNode
          return ts.factory.updateTypeAliasDeclaration(
            node,
            node.modifiers,
            node.name,
            undefined,
            updatedType,
          )
        }
      }

      if (ts.isFunctionDeclaration(node)) {
        const genericInfo = functionGenerics.get(node)
        if (genericInfo) {
          changed = true
          const updatedParameters = node.parameters.map((parameter) => {
            if (!parameter.type) {
              return parameter
            }

            const updatedType = replaceTypeReferences(
              parameter.type,
              context,
              genericInfo.paramName,
              genericInfo.defaultType,
              referencedAliases,
            ) as ts.TypeNode
            return ts.factory.updateParameterDeclaration(
              parameter,
              parameter.modifiers,
              parameter.dotDotDotToken,
              parameter.name,
              parameter.questionToken,
              updatedType,
              parameter.initializer,
            )
          })

          const updatedReturnType = node.type
            ? (replaceTypeReferences(
                node.type,
                context,
                genericInfo.paramName,
                genericInfo.defaultType,
                referencedAliases,
              ) as ts.TypeNode)
            : undefined

          return ts.factory.updateFunctionDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            undefined,
            updatedParameters,
            updatedReturnType,
            node.body,
          )
        }
      }

      if (
        ts.isTypeReferenceNode(node) &&
        node.typeArguments &&
        node.typeArguments.length > 0 &&
        ts.isIdentifier(node.typeName) &&
        referencedAliases.has(node.typeName.text)
      ) {
        changed = true
        return ts.factory.updateTypeReferenceNode(node, node.typeName, undefined)
      }

      return ts.visitEachChild(node, visit, context)
    }

    return (node) => ts.visitNode(node, visit) as ts.SourceFile
  }

  const transformed = ts.transform(sourceFile, [transformer])
  const output = ts.createPrinter().printFile(transformed.transformed[0])
  transformed.dispose()

  return changed ? output : text
}

export function generateApiDoc(projectRoot: string): GenerationResult | null {
  _projectRoot = projectRoot
  _kobalteHashMap = undefined
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
